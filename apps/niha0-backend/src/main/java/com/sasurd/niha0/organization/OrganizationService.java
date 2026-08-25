package com.sasurd.niha0.organization;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.common.Role;
import com.sasurd.niha0.identity.MailService;
import com.sasurd.niha0.identity.User;
import com.sasurd.niha0.identity.UserRepository;
import com.sasurd.niha0.organization.dto.CompanyDataAssetRequest;
import com.sasurd.niha0.organization.dto.CompanyDataAssetResponse;
import com.sasurd.niha0.organization.dto.CreateInviteRequest;
import com.sasurd.niha0.organization.dto.InviteResponse;
import com.sasurd.niha0.organization.dto.MembershipResponse;
import com.sasurd.niha0.organization.dto.OrganizationResponse;
import com.sasurd.niha0.organization.dto.OrganizationUpdateRequest;
import com.sasurd.niha0.organization.dto.UpdateMemberRequest;
import com.sasurd.niha0.rag.DocumentIndexingService;
import com.sasurd.niha0.security.SecurityUtils;
import com.sasurd.niha0.storage.ObjectStorageService;
import com.sasurd.niha0.storage.StoredAsset;
import com.sasurd.niha0.storage.StoredAssetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class OrganizationService {

    private static final Set<String> LOGO_TYPES = Set.of(
            "image/png", "image/jpeg", "image/jpg", "image/webp"
    );
    private static final Set<String> DOCUMENT_TYPES = Set.of(
            "application/pdf",
            "text/plain",
            "text/csv",
            "application/json",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "image/png",
            "image/jpeg",
            "image/webp"
    );
    private static final long MAX_LOGO_BYTES = 2_000_000L;
    private static final long MAX_DOCUMENT_BYTES = 15_000_000L;
    private static final int MAX_WORKSPACE_CONFIG_BYTES = 100_000;

    private static final ObjectMapper JSON = new ObjectMapper();

    private final OrganizationRepository organizationRepository;
    private final MembershipRepository membershipRepository;
    private final OrganizationInviteRepository organizationInviteRepository;
    private final UserRepository userRepository;
    private final MailService mailService;
    private final CompanyDataAssetRepository dataAssetRepository;
    private final ObjectStorageService objectStorage;
    private final StoredAssetRepository storedAssetRepository;
    private final DocumentIndexingService documentIndexingService;

    public OrganizationService(OrganizationRepository organizationRepository,
                               MembershipRepository membershipRepository,
                               OrganizationInviteRepository organizationInviteRepository,
                               UserRepository userRepository,
                               MailService mailService,
                               CompanyDataAssetRepository dataAssetRepository,
                               ObjectStorageService objectStorage,
                               StoredAssetRepository storedAssetRepository,
                               DocumentIndexingService documentIndexingService) {
        this.organizationRepository = organizationRepository;
        this.membershipRepository = membershipRepository;
        this.organizationInviteRepository = organizationInviteRepository;
        this.userRepository = userRepository;
        this.mailService = mailService;
        this.dataAssetRepository = dataAssetRepository;
        this.objectStorage = objectStorage;
        this.storedAssetRepository = storedAssetRepository;
        this.documentIndexingService = documentIndexingService;
    }

    @Transactional(readOnly = true)
    public OrganizationResponse currentOrganization() {
        return toResponse(requireOrg());
    }

    @Transactional(readOnly = true)
    public List<MembershipResponse> listMembers() {
        UUID orgId = SecurityUtils.requireOrganizationId();
        return membershipRepository.findByOrganizationIdAndActiveTrue(orgId).stream()
                .map(this::toMembershipResponse)
                .toList();
    }

    @Transactional
    public OrganizationResponse updateCurrent(OrganizationUpdateRequest request) {
        requireOwnerOrAdmin();
        Organization org = requireOrg();
        if (request.name() != null && !request.name().isBlank()) {
            org.setName(request.name().trim());
        }
        if (request.sector() != null) org.setSector(blankToNull(request.sector()));
        if (request.description() != null) org.setDescription(blankToNull(request.description()));
        if (request.website() != null) org.setWebsite(blankToNull(request.website()));
        if (request.country() != null) org.setCountry(blankToNull(request.country()));
        if (request.city() != null) org.setCity(blankToNull(request.city()));
        if (request.companySize() != null) org.setCompanySize(blankToNull(request.companySize()));
        if (request.professionalEmail() != null) org.setProfessionalEmail(blankToNull(request.professionalEmail()));
        if (request.slogan() != null) org.setSlogan(blankToNull(request.slogan()));
        if (request.onboardingStatus() != null && !request.onboardingStatus().isBlank()) {
            org.setOnboardingStatus(request.onboardingStatus().trim().toUpperCase(Locale.ROOT));
        }
        if (request.workspaceConfig() != null) {
            validateWorkspaceConfig(request.workspaceConfig());
            org.setWorkspaceConfig(request.workspaceConfig());
        }
        if (request.logoUrl() != null) org.setLogoUrl(blankToNull(request.logoUrl()));
        return toResponse(organizationRepository.save(org));
    }

    @Transactional
    public OrganizationResponse uploadLogo(MultipartFile file) {
        requireOwnerOrAdmin();
        if (file == null || file.isEmpty()) {
            throw new ApiException(400, "Logo file is required");
        }
        if (file.getSize() > MAX_LOGO_BYTES) {
            throw new ApiException(400, "Logo too large (max 2 MB)");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!LOGO_TYPES.contains(contentType) && !contentType.equals("image/jpg")) {
            throw new ApiException(400, "Unsupported logo type. Use PNG, JPG, JPEG or WEBP.");
        }
        try {
            byte[] bytes = file.getBytes();
            if (!looksLikeRasterImage(bytes, contentType)) {
                throw new ApiException(400, "File content does not match declared image type");
            }
            Organization org = requireOrg();
            UUID orgId = org.getId();

            // Persist binary outside DB (source of truth going forward).
            ObjectStorageService.StoredObject stored = objectStorage.put(
                    orgId,
                    "logo",
                    file.getOriginalFilename() == null ? "logo.bin" : file.getOriginalFilename(),
                    contentType,
                    new ByteArrayInputStream(bytes),
                    bytes.length);

            StoredAsset asset = new StoredAsset();
            asset.setOrganizationId(orgId);
            asset.setStorageKey(stored.storageKey());
            asset.setOriginalFilename(file.getOriginalFilename() == null ? "logo" : file.getOriginalFilename());
            asset.setContentType(contentType);
            asset.setSizeBytes(stored.sizeBytes());
            asset.setKind("ORGANIZATION_LOGO");
            asset.setProcessingStatus("UPLOADED");
            asset.setCreatedBy(SecurityUtils.currentUserId());
            StoredAsset savedAsset = storedAssetRepository.save(asset);

            // Temporary dual-write: keep Base64 data-URL so 3D / existing clients keep working.
            String dataUrl = "data:" + contentType + ";base64," + Base64.getEncoder().encodeToString(bytes);
            org.setLogoUrl(dataUrl);
            org.setLogoAssetId(savedAsset.getId());
            return toResponse(organizationRepository.save(org));
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ApiException(500, "Failed to store logo");
        }
    }

    @Transactional
    public OrganizationResponse clearLogo() {
        requireOwnerOrAdmin();
        Organization org = requireOrg();
        if (org.getLogoAssetId() != null) {
            storedAssetRepository.findByIdAndOrganizationId(org.getLogoAssetId(), org.getId())
                    .ifPresent(asset -> {
                        objectStorage.delete(asset.getStorageKey());
                        storedAssetRepository.delete(asset);
                    });
            org.setLogoAssetId(null);
        }
        org.setLogoUrl(null);
        return toResponse(organizationRepository.save(org));
    }

    @Transactional(readOnly = true)
    public List<CompanyDataAssetResponse> listDataAssets() {
        UUID orgId = SecurityUtils.requireOrganizationId();
        return dataAssetRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                .map(this::toAssetResponse)
                .toList();
    }

    @Transactional
    public CompanyDataAssetResponse createDataAsset(CompanyDataAssetRequest request) {
        requireOwnerOrAdmin();
        UUID orgId = SecurityUtils.requireOrganizationId();
        CompanyDataAsset asset = new CompanyDataAsset();
        asset.setOrganizationId(orgId);
        asset.setName(request.name().trim());
        asset.setFileType(request.fileType().trim().toUpperCase(Locale.ROOT));
        asset.setMimeType(request.mimeType());
        asset.setSizeBytes(Math.max(0, request.sizeBytes()));
        asset.setDescription(blankToNull(request.description()));
        asset.setCategory(blankToNull(request.category()));
        asset.setStorageReference(blankToNull(request.storageReference()));
        asset.setLinkedAgentIds(blankToNull(request.linkedAgentIds()));
        asset.setStatus(request.status() == null || request.status().isBlank() ? "IMPORTED" : request.status());
        asset.setProcessingStatus(
                request.processingStatus() == null || request.processingStatus().isBlank()
                        ? "UPLOADED"
                        : request.processingStatus());
        return toAssetResponse(dataAssetRepository.save(asset));
    }

    @Transactional
    public CompanyDataAssetResponse updateDataAsset(UUID id, CompanyDataAssetRequest request) {
        requireOwnerOrAdmin();
        UUID orgId = SecurityUtils.requireOrganizationId();
        CompanyDataAsset asset = dataAssetRepository.findById(id)
                .filter(a -> orgId.equals(a.getOrganizationId()))
                .orElseThrow(() -> new ApiException(404, "Data asset not found"));
        if (request.name() != null && !request.name().isBlank()) asset.setName(request.name().trim());
        if (request.description() != null) asset.setDescription(blankToNull(request.description()));
        if (request.category() != null) asset.setCategory(blankToNull(request.category()));
        if (request.linkedAgentIds() != null) asset.setLinkedAgentIds(blankToNull(request.linkedAgentIds()));
        if (request.status() != null && !request.status().isBlank()) asset.setStatus(request.status());
        if (request.processingStatus() != null && !request.processingStatus().isBlank()) {
            asset.setProcessingStatus(request.processingStatus());
        }
        if (request.storageReference() != null) asset.setStorageReference(blankToNull(request.storageReference()));
        return toAssetResponse(dataAssetRepository.save(asset));
    }

    @Transactional
    public CompanyDataAssetResponse uploadDataAsset(MultipartFile file, String category, String description) {
        requireOwnerOrAdmin();
        if (file == null || file.isEmpty()) {
            throw new ApiException(400, "File is required");
        }
        if (file.getSize() > MAX_DOCUMENT_BYTES) {
            throw new ApiException(400, "File too large (max 15 MB)");
        }
        String contentType = file.getContentType() == null ? "application/octet-stream"
                : file.getContentType().toLowerCase(Locale.ROOT);
        if (!DOCUMENT_TYPES.contains(contentType) && !contentType.startsWith("text/")) {
            throw new ApiException(400, "Unsupported file type");
        }

        UUID orgId = SecurityUtils.requireOrganizationId();
        String originalName = file.getOriginalFilename() == null ? "document" : file.getOriginalFilename();
        String ext = extensionOf(originalName);
        String fileType = mapFileType(ext, contentType);

        try {
            byte[] bytes = file.getBytes();
            ObjectStorageService.StoredObject stored = objectStorage.put(
                    orgId,
                    "document",
                    originalName,
                    contentType,
                    new ByteArrayInputStream(bytes),
                    bytes.length);

            StoredAsset storedAsset = new StoredAsset();
            storedAsset.setOrganizationId(orgId);
            storedAsset.setStorageKey(stored.storageKey());
            storedAsset.setOriginalFilename(originalName);
            storedAsset.setContentType(contentType);
            storedAsset.setSizeBytes(stored.sizeBytes());
            storedAsset.setKind("DOCUMENT");
            storedAsset.setProcessingStatus("UPLOADED");
            storedAsset.setCreatedBy(SecurityUtils.currentUserId());
            storedAsset = storedAssetRepository.save(storedAsset);

            CompanyDataAsset asset = new CompanyDataAsset();
            asset.setOrganizationId(orgId);
            asset.setName(originalName);
            asset.setFileType(fileType);
            asset.setMimeType(contentType);
            asset.setSizeBytes(stored.sizeBytes());
            asset.setDescription(blankToNull(description));
            asset.setCategory(blankToNull(category));
            asset.setStorageReference(stored.storageKey());
            asset.setStoredAssetId(storedAsset.getId());
            asset.setStatus("IMPORTED");
            asset.setProcessingStatus("UPLOADED");
            asset = dataAssetRepository.save(asset);
            documentIndexingService.indexAsset(asset, stored.storageKey(), contentType, bytes);
            return toAssetResponse(dataAssetRepository.findById(asset.getId()).orElse(asset));
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ApiException(500, "Failed to upload document");
        }
    }

    @Transactional
    public void deleteDataAsset(UUID id) {
        requireOwnerOrAdmin();
        UUID orgId = SecurityUtils.requireOrganizationId();
        CompanyDataAsset asset = dataAssetRepository.findById(id)
                .filter(a -> orgId.equals(a.getOrganizationId()))
                .orElseThrow(() -> new ApiException(404, "Data asset not found"));
        if (asset.getStoredAssetId() != null) {
            storedAssetRepository.findByIdAndOrganizationId(asset.getStoredAssetId(), orgId)
                    .ifPresent(sa -> {
                        objectStorage.delete(sa.getStorageKey());
                        storedAssetRepository.delete(sa);
                    });
        }
        dataAssetRepository.delete(asset);
    }

    @Transactional
    public InviteResponse createInvite(CreateInviteRequest request) {
        requireOwnerOrAdmin();
        if (request.role() == Role.OWNER) {
            throw new ApiException(400, "Cannot invite with OWNER role");
        }
        UUID orgId = SecurityUtils.requireOrganizationId();
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        OrganizationInvite invite = new OrganizationInvite();
        invite.setOrganizationId(orgId);
        invite.setEmail(email);
        invite.setRole(request.role());
        UUID token = UUID.randomUUID();
        invite.setToken(token);
        invite.setInvitedBy(SecurityUtils.currentUserId());
        invite.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
        organizationInviteRepository.save(invite);
        mailService.sendOrganizationInvite(email, token);

        return toInviteResponse(invite);
    }

    @Transactional(readOnly = true)
    public List<InviteResponse> listPendingInvites() {
        requireOwnerOrAdmin();
        UUID orgId = SecurityUtils.requireOrganizationId();
        return organizationInviteRepository.findByOrganizationIdAndAcceptedAtIsNullOrderByCreatedAtDesc(orgId).stream()
                .map(this::toInviteResponse)
                .toList();
    }

    @Transactional
    public MembershipResponse updateMember(UUID membershipId, UpdateMemberRequest request) {
        requireOwnerOrAdmin();
        UUID orgId = SecurityUtils.requireOrganizationId();
        Membership membership = membershipRepository.findByIdAndOrganizationId(membershipId, orgId)
                .orElseThrow(() -> new ApiException(404, "Membership not found"));

        UUID currentUserId = SecurityUtils.currentUserId();
        Role newRole = request.role() != null ? request.role() : membership.getRole();
        boolean newActive = request.active() != null ? request.active() : membership.isActive();

        assertOwnerSafeguards(membership, newRole, newActive, currentUserId);

        if (request.role() != null) {
            membership.setRole(request.role());
        }
        if (request.active() != null) {
            membership.setActive(request.active());
        }
        return toMembershipResponse(membershipRepository.save(membership));
    }

    @Transactional
    public void deactivateMember(UUID membershipId) {
        requireOwnerOrAdmin();
        UUID orgId = SecurityUtils.requireOrganizationId();
        Membership membership = membershipRepository.findByIdAndOrganizationId(membershipId, orgId)
                .orElseThrow(() -> new ApiException(404, "Membership not found"));

        assertOwnerSafeguards(membership, membership.getRole(), false, SecurityUtils.currentUserId());
        membership.setActive(false);
        membershipRepository.save(membership);
    }

    private void assertOwnerSafeguards(Membership membership, Role newRole, boolean newActive, UUID currentUserId) {
        UUID orgId = membership.getOrganizationId();
        long ownerCount = membershipRepository.countByOrganizationIdAndRoleAndActiveTrue(orgId, Role.OWNER);
        boolean isOwner = membership.getRole() == Role.OWNER;
        boolean targetIsCurrentUser = membership.getUserId().equals(currentUserId);

        if (isOwner && (!newActive || newRole != Role.OWNER)) {
            if (ownerCount <= 1) {
                throw new ApiException(409, "Cannot remove or demote the last OWNER");
            }
        }
        if (targetIsCurrentUser && isOwner && newRole != Role.OWNER) {
            if (ownerCount <= 1) {
                throw new ApiException(409, "Cannot change your role while you are the sole OWNER");
            }
        }
    }

    private InviteResponse toInviteResponse(OrganizationInvite invite) {
        return new InviteResponse(
                invite.getId(),
                invite.getEmail(),
                invite.getRole(),
                invite.getToken(),
                invite.getExpiresAt(),
                invite.getCreatedAt());
    }

    private static String extensionOf(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot < 0 ? "BIN" : filename.substring(dot + 1).toUpperCase(Locale.ROOT);
    }

    private static String mapFileType(String ext, String mime) {
        if (List.of("PNG", "JPG", "JPEG", "WEBP", "GIF").contains(ext)) return "IMAGE";
        if ("PDF".equals(ext) || mime.contains("pdf")) return "PDF";
        if ("CSV".equals(ext)) return "CSV";
        if ("XLSX".equals(ext) || "XLS".equals(ext)) return "XLSX";
        if ("DOCX".equals(ext)) return "DOCX";
        if ("JSON".equals(ext)) return "JSON";
        if ("TXT".equals(ext)) return "TXT";
        return ext.length() > 12 ? ext.substring(0, 12) : ext;
    }

    private Organization requireOrg() {
        UUID orgId = SecurityUtils.requireOrganizationId();
        return organizationRepository.findById(orgId)
                .orElseThrow(() -> new ApiException(404, "Organization not found"));
    }

    private void requireOwnerOrAdmin() {
        Role role = SecurityUtils.currentRole();
        if (role != Role.OWNER && role != Role.ADMIN) {
            throw new ApiException(403, "Only OWNER or ADMIN can update the workspace");
        }
    }

    private static String blankToNull(String value) {
        if (value == null) return null;
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    OrganizationResponse toResponse(Organization org) {
        return new OrganizationResponse(
                org.getId(),
                org.getName(),
                org.getSlug(),
                org.getSector(),
                org.getDescription(),
                org.getWebsite(),
                org.getCountry(),
                org.getCity(),
                org.getCompanySize(),
                org.getProfessionalEmail(),
                org.getSlogan(),
                org.getLogoUrl(),
                org.getLogoAssetId(),
                org.getOnboardingStatus() == null ? "COMPLETED" : org.getOnboardingStatus(),
                org.getWorkspaceConfig()
        );
    }

    private MembershipResponse toMembershipResponse(Membership membership) {
        User user = userRepository.findById(membership.getUserId())
                .orElseThrow(() -> new ApiException(404, "User not found"));
        return new MembershipResponse(
                membership.getId(), user.getId(), user.getEmail(),
                user.getFirstName(), user.getLastName(), membership.getRole(), membership.isActive());
    }

    private CompanyDataAssetResponse toAssetResponse(CompanyDataAsset asset) {
        return new CompanyDataAssetResponse(
                asset.getId(),
                asset.getOrganizationId(),
                asset.getName(),
                asset.getFileType(),
                asset.getMimeType(),
                asset.getSizeBytes(),
                asset.getStatus(),
                asset.getProcessingStatus(),
                asset.getDescription(),
                asset.getCategory(),
                asset.getStorageReference(),
                asset.getLinkedAgentIds(),
                asset.getStoredAssetId(),
                asset.getCreatedAt(),
                asset.getUpdatedAt()
        );
    }

    private void validateWorkspaceConfig(String json) {
        if (json.length() > MAX_WORKSPACE_CONFIG_BYTES) {
            throw new ApiException(400, "workspaceConfig exceeds maximum size");
        }
        try {
            JSON.readTree(json);
        } catch (Exception e) {
            throw new ApiException(400, "workspaceConfig must be valid JSON");
        }
    }

    /** Light magic-byte check so Content-Type alone cannot smuggle non-images as logos. */
    private static boolean looksLikeRasterImage(byte[] bytes, String contentType) {
        if (bytes == null || bytes.length < 12) {
            return false;
        }
        boolean png = bytes[0] == (byte) 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47;
        boolean jpeg = bytes[0] == (byte) 0xFF && bytes[1] == (byte) 0xD8 && bytes[2] == (byte) 0xFF;
        boolean webp = bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';
        String ct = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
        if (ct.contains("png")) {
            return png;
        }
        if (ct.contains("jpeg") || ct.contains("jpg")) {
            return jpeg;
        }
        if (ct.contains("webp")) {
            return webp;
        }
        return png || jpeg || webp;
    }
}
