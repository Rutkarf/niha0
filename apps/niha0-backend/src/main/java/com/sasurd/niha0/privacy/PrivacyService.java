package com.sasurd.niha0.privacy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sasurd.niha0.accounting.InvoiceRepository;
import com.sasurd.niha0.agents.AgentRepository;
import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.common.Role;
import com.sasurd.niha0.crm.CustomerRepository;
import com.sasurd.niha0.customerrelations.TicketRepository;
import com.sasurd.niha0.identity.User;
import com.sasurd.niha0.identity.UserRepository;
import com.sasurd.niha0.organization.Membership;
import com.sasurd.niha0.organization.MembershipRepository;
import com.sasurd.niha0.organization.Organization;
import com.sasurd.niha0.organization.OrganizationRepository;
import com.sasurd.niha0.security.SecurityUtils;
import com.sasurd.niha0.storage.ObjectStorageService;
import com.sasurd.niha0.storage.StoredAsset;
import com.sasurd.niha0.storage.StoredAssetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PrivacyService {

    private static final ObjectMapper JSON = new ObjectMapper();

    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;
    private final OrganizationRepository organizationRepository;
    private final PrivacyRequestRepository privacyRequestRepository;
    private final CustomerRepository customerRepository;
    private final TicketRepository ticketRepository;
    private final InvoiceRepository invoiceRepository;
    private final AgentRepository agentRepository;
    private final StoredAssetRepository storedAssetRepository;
    private final ObjectStorageService objectStorage;

    public PrivacyService(UserRepository userRepository,
                          MembershipRepository membershipRepository,
                          OrganizationRepository organizationRepository,
                          PrivacyRequestRepository privacyRequestRepository,
                          CustomerRepository customerRepository,
                          TicketRepository ticketRepository,
                          InvoiceRepository invoiceRepository,
                          AgentRepository agentRepository,
                          StoredAssetRepository storedAssetRepository,
                          ObjectStorageService objectStorage) {
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.organizationRepository = organizationRepository;
        this.privacyRequestRepository = privacyRequestRepository;
        this.customerRepository = customerRepository;
        this.ticketRepository = ticketRepository;
        this.invoiceRepository = invoiceRepository;
        this.agentRepository = agentRepository;
        this.storedAssetRepository = storedAssetRepository;
        this.objectStorage = objectStorage;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> exportPersonalData() {
        UUID userId = SecurityUtils.currentUserId();
        UUID orgId = SecurityUtils.requireOrganizationId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(404, "User not found"));
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ApiException(404, "Organization not found"));

        List<Map<String, Object>> memberships = membershipRepository.findByUserId(userId).stream()
                .map(this::membershipSummary)
                .toList();

        List<Map<String, Object>> assets = storedAssetRepository.findByCreatedBy(userId).stream()
                .map(a -> Map.<String, Object>of(
                        "id", a.getId(),
                        "kind", a.getKind(),
                        "originalFilename", a.getOriginalFilename(),
                        "sizeBytes", a.getSizeBytes(),
                        "organizationId", a.getOrganizationId()))
                .toList();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("profile", Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "firstName", user.getFirstName(),
                "lastName", user.getLastName(),
                "locale", user.getLocale() == null ? "fr" : user.getLocale(),
                "createdAt", user.getCreatedAt()));
        payload.put("memberships", memberships);
        payload.put("uploadedAssets", assets);
        payload.put("currentOrganization", Map.of(
                "id", org.getId(),
                "name", org.getName(),
                "slug", org.getSlug()));
        payload.put("tenantDataCounts", tenantCounts(orgId));

        logPrivacyRequest(orgId, userId, "EXPORT", payload);
        return payload;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> exportOrganizationSummary() {
        requireOwner();
        UUID orgId = SecurityUtils.requireOrganizationId();
        UUID userId = SecurityUtils.currentUserId();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("organizationId", orgId);
        payload.put("tenantDataCounts", tenantCounts(orgId));
        payload.put("activeMembers", membershipRepository.findByOrganizationIdAndActiveTrue(orgId).size());
        payload.put("storageBytes", storedAssetRepository.sumSizeBytesByOrganizationId(orgId));

        logPrivacyRequest(orgId, userId, "EXPORT_ORG", payload);
        return payload;
    }

    @Transactional
    public Map<String, Object> eraseMe() {
        UUID userId = SecurityUtils.currentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(404, "User not found"));

        List<Membership> memberships = membershipRepository.findByUserId(userId);
        for (Membership membership : memberships) {
            if (membership.getRole() == Role.OWNER && membership.isActive()) {
                long ownerCount = membershipRepository.countByOrganizationIdAndRoleAndActiveTrue(
                        membership.getOrganizationId(), Role.OWNER);
                if (ownerCount <= 1) {
                    throw new ApiException(409,
                            "Cannot erase account while you are the sole OWNER of an organization");
                }
            }
        }

        int deletedAssets = 0;
        for (StoredAsset asset : storedAssetRepository.findByCreatedBy(userId)) {
            try {
                objectStorage.delete(asset.getStorageKey());
            } catch (Exception ignored) {
                // continue deleting metadata even if blob already gone
            }
            storedAssetRepository.delete(asset);
            deletedAssets++;
        }

        user.setEmail("erased+" + UUID.randomUUID() + "@deleted.local");
        user.setFirstName("Erased");
        user.setLastName("User");
        user.setActive(false);
        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        userRepository.save(user);

        for (Membership membership : memberships) {
            membership.setActive(false);
            membershipRepository.save(membership);
        }

        Map<String, Object> payload = Map.of(
                "userId", userId,
                "status", "ERASED",
                "deletedAssets", deletedAssets);
        UUID orgId = SecurityUtils.currentOrganizationId();
        if (orgId != null) {
            logPrivacyRequest(orgId, userId, "ERASE", payload);
        } else if (!memberships.isEmpty()) {
            logPrivacyRequest(memberships.getFirst().getOrganizationId(), userId, "ERASE", payload);
        }
        return payload;
    }

    private Map<String, Object> tenantCounts(UUID orgId) {
        Map<String, Object> counts = new LinkedHashMap<>();
        counts.put("customers", customerRepository.countByOrganizationId(orgId));
        counts.put("tickets", ticketRepository.countByOrganizationId(orgId));
        counts.put("invoices", invoiceRepository.countByOrganizationId(orgId));
        counts.put("agents", agentRepository.countByOrganizationId(orgId));
        counts.put("storageBytes", storedAssetRepository.sumSizeBytesByOrganizationId(orgId));
        return counts;
    }

    private Map<String, Object> membershipSummary(Membership membership) {
        Organization org = organizationRepository.findById(membership.getOrganizationId()).orElse(null);
        return Map.of(
                "organizationId", membership.getOrganizationId(),
                "organizationName", org != null ? org.getName() : "",
                "role", membership.getRole(),
                "active", membership.isActive());
    }

    private void logPrivacyRequest(UUID orgId, UUID userId, String type, Map<String, Object> payload) {
        try {
            PrivacyRequest request = new PrivacyRequest();
            request.setOrganizationId(orgId);
            request.setUserId(userId);
            request.setRequestType(type);
            request.setStatus("COMPLETED");
            request.setPayloadJson(JSON.writeValueAsString(payload));
            privacyRequestRepository.save(request);
        } catch (Exception ignored) {
            PrivacyRequest request = new PrivacyRequest();
            request.setOrganizationId(orgId);
            request.setUserId(userId);
            request.setRequestType(type);
            request.setStatus("COMPLETED");
            privacyRequestRepository.save(request);
        }
    }

    private void requireOwner() {
        if (SecurityUtils.currentRole() != Role.OWNER) {
            throw new ApiException(403, "Only OWNER can export organization data");
        }
    }
}
