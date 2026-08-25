package com.sasurd.niha0.platform;

import com.sasurd.niha0.audit.AuditService;
import com.sasurd.niha0.organization.Organization;
import com.sasurd.niha0.organization.OrganizationRepository;
import com.sasurd.niha0.organization.MembershipRepository;
import com.sasurd.niha0.security.SecurityUtils;
import com.sasurd.niha0.storage.StoredAssetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PlatformAdminService {

    private final OrganizationRepository organizationRepository;
    private final MembershipRepository membershipRepository;
    private final StoredAssetRepository storedAssetRepository;
    private final AuditService auditService;

    public PlatformAdminService(OrganizationRepository organizationRepository,
                                MembershipRepository membershipRepository,
                                StoredAssetRepository storedAssetRepository,
                                AuditService auditService) {
        this.organizationRepository = organizationRepository;
        this.membershipRepository = membershipRepository;
        this.storedAssetRepository = storedAssetRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<PlatformOrgSummary> listOrganizations() {
        return organizationRepository.findAll().stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional
    public PlatformOrgSummary suspend(java.util.UUID orgId, boolean suspended) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new com.sasurd.niha0.common.ApiException(404, "Organization not found"));
        // Soft flag via onboardingStatus sentinel when no dedicated column exists
        if (suspended) {
            org.setOnboardingStatus("SUSPENDED");
        } else if ("SUSPENDED".equalsIgnoreCase(org.getOnboardingStatus())) {
            org.setOnboardingStatus("COMPLETED");
        }
        Organization saved = organizationRepository.save(org);
        auditService.logFor(
                saved.getId(),
                SecurityUtils.currentUserId(),
                suspended ? "ORG_SUSPEND" : "ORG_UNSUSPEND",
                "Organization",
                saved.getId(),
                saved.getSlug());
        return toSummary(saved);
    }

    private PlatformOrgSummary toSummary(Organization org) {
        int seats = membershipRepository.findByOrganizationIdAndActiveTrue(org.getId()).size();
        long storage = storedAssetRepository.sumSizeBytesByOrganizationId(org.getId());
        return new PlatformOrgSummary(
                org.getId(),
                org.getName(),
                org.getSlug(),
                org.getBillingPlan(),
                org.getOnboardingStatus(),
                seats,
                storage);
    }
}
