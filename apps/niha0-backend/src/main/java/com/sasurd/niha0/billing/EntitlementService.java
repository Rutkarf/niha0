package com.sasurd.niha0.billing;

import com.sasurd.niha0.agents.AgentActionRepository;
import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.organization.MembershipRepository;
import com.sasurd.niha0.organization.Organization;
import com.sasurd.niha0.organization.OrganizationInviteRepository;
import com.sasurd.niha0.organization.OrganizationRepository;
import com.sasurd.niha0.storage.StoredAssetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Plan entitlements: seats, storage bytes, daily AI recommendations.
 */
@Service
public class EntitlementService {

    public static final Map<String, Integer> SEAT_LIMITS = Map.of(
            "FREE", 3,
            "PRO", 25,
            "BUSINESS", 100
    );

    public static final Map<String, Long> STORAGE_LIMITS_BYTES = Map.of(
            "FREE", 100L * 1024 * 1024,
            "PRO", 5L * 1024 * 1024 * 1024,
            "BUSINESS", 50L * 1024 * 1024 * 1024
    );

    public static final Map<String, Integer> AI_DAILY_LIMITS = Map.of(
            "FREE", 20,
            "PRO", 500,
            "BUSINESS", 5_000
    );

    private final OrganizationRepository organizationRepository;
    private final MembershipRepository membershipRepository;
    private final OrganizationInviteRepository inviteRepository;
    private final StoredAssetRepository storedAssetRepository;
    private final AgentActionRepository agentActionRepository;

    public EntitlementService(OrganizationRepository organizationRepository,
                              MembershipRepository membershipRepository,
                              OrganizationInviteRepository inviteRepository,
                              StoredAssetRepository storedAssetRepository,
                              AgentActionRepository agentActionRepository) {
        this.organizationRepository = organizationRepository;
        this.membershipRepository = membershipRepository;
        this.inviteRepository = inviteRepository;
        this.storedAssetRepository = storedAssetRepository;
        this.agentActionRepository = agentActionRepository;
    }

    @Transactional(readOnly = true)
    public void assertSeatAvailable(UUID organizationId) {
        Organization org = requireOrg(organizationId);
        String plan = normalizePlan(org.getBillingPlan());
        int limit = SEAT_LIMITS.getOrDefault(plan, 3);
        int active = membershipRepository.findByOrganizationIdAndActiveTrue(organizationId).size();
        if (active >= limit) {
            throw new ApiException(403,
                    "Seat limit reached for plan " + plan + " (" + limit + "). Upgrade billing or deactivate a member.");
        }
    }

    /** Soft reserve: active members + open invites must stay under plan seat limit. */
    @Transactional(readOnly = true)
    public void assertInviteSlotAvailable(UUID organizationId) {
        Organization org = requireOrg(organizationId);
        String plan = normalizePlan(org.getBillingPlan());
        int limit = SEAT_LIMITS.getOrDefault(plan, 3);
        int active = membershipRepository.findByOrganizationIdAndActiveTrue(organizationId).size();
        int pending = inviteRepository.findByOrganizationIdAndAcceptedAtIsNullOrderByCreatedAtDesc(organizationId).size();
        if (active + pending >= limit) {
            throw new ApiException(403,
                    "Seat limit reached for plan " + plan + " (" + limit + "). Upgrade billing or revoke invites.");
        }
    }

    @Transactional(readOnly = true)
    public void assertStorageAvailable(UUID organizationId, long additionalBytes) {
        Organization org = requireOrg(organizationId);
        String plan = normalizePlan(org.getBillingPlan());
        long limit = STORAGE_LIMITS_BYTES.getOrDefault(plan, STORAGE_LIMITS_BYTES.get("FREE"));
        long used = storedAssetRepository.sumSizeBytesByOrganizationId(organizationId);
        if (used + additionalBytes > limit) {
            throw new ApiException(403,
                    "Storage quota exceeded for plan " + plan
                            + " (used " + used + " / limit " + limit + " bytes).");
        }
    }

    @Transactional(readOnly = true)
    public void assertAiActionAvailable(UUID organizationId) {
        Organization org = requireOrg(organizationId);
        String plan = normalizePlan(org.getBillingPlan());
        int limit = AI_DAILY_LIMITS.getOrDefault(plan, 20);
        Instant since = Instant.now().minus(1, ChronoUnit.DAYS);
        long used = agentActionRepository.countByOrganizationIdAndCreatedAtAfter(organizationId, since);
        if (used >= limit) {
            throw new ApiException(403,
                    "Daily AI recommendation limit reached for plan " + plan + " (" + limit + "/day).");
        }
    }

    @Transactional(readOnly = true)
    public QuotaSnapshot snapshot(UUID organizationId) {
        Organization org = requireOrg(organizationId);
        String plan = normalizePlan(org.getBillingPlan());
        int seatsUsed = membershipRepository.findByOrganizationIdAndActiveTrue(organizationId).size();
        int seatsLimit = SEAT_LIMITS.getOrDefault(plan, 3);
        long storageUsed = storedAssetRepository.sumSizeBytesByOrganizationId(organizationId);
        long storageLimit = STORAGE_LIMITS_BYTES.getOrDefault(plan, STORAGE_LIMITS_BYTES.get("FREE"));
        Instant since = Instant.now().minus(1, ChronoUnit.DAYS);
        int aiUsed = (int) agentActionRepository.countByOrganizationIdAndCreatedAtAfter(organizationId, since);
        int aiLimit = AI_DAILY_LIMITS.getOrDefault(plan, 20);
        return new QuotaSnapshot(plan, seatsUsed, seatsLimit, storageUsed, storageLimit, aiUsed, aiLimit);
    }

    public record QuotaSnapshot(
            String plan,
            int seatsUsed,
            int seatsLimit,
            long storageUsedBytes,
            long storageLimitBytes,
            int aiActionsUsedToday,
            int aiActionsLimitDaily
    ) {
        public String storageNote() {
            return "Stockage " + human(storageUsedBytes) + " / " + human(storageLimitBytes)
                    + " · IA " + aiActionsUsedToday + "/" + aiActionsLimitDaily + " /jour";
        }

        private static String human(long bytes) {
            if (bytes < 1024) return bytes + " B";
            if (bytes < 1024 * 1024) return String.format(Locale.ROOT, "%.1f KB", bytes / 1024.0);
            if (bytes < 1024L * 1024 * 1024) return String.format(Locale.ROOT, "%.1f MB", bytes / (1024.0 * 1024));
            return String.format(Locale.ROOT, "%.1f GB", bytes / (1024.0 * 1024 * 1024));
        }
    }

    private Organization requireOrg(UUID organizationId) {
        return organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ApiException(404, "Organization not found"));
    }

    public static String normalizePlan(String plan) {
        if (plan == null || plan.isBlank()) {
            return "FREE";
        }
        return plan.trim().toUpperCase(Locale.ROOT);
    }
}
