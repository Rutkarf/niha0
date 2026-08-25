package com.sasurd.niha0.billing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sasurd.niha0.audit.AuditService;
import com.sasurd.niha0.billing.dto.BillingPlanResponse;
import com.sasurd.niha0.billing.dto.CheckoutResponse;
import com.sasurd.niha0.billing.dto.CreateCheckoutRequest;
import com.sasurd.niha0.billing.dto.UpdateBillingPlanRequest;
import com.sasurd.niha0.billing.sumup.SumUpCheckoutResult;
import com.sasurd.niha0.billing.sumup.SumUpClient;
import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.common.Role;
import com.sasurd.niha0.config.BillingProperties;
import com.sasurd.niha0.organization.MembershipRepository;
import com.sasurd.niha0.organization.Organization;
import com.sasurd.niha0.organization.OrganizationRepository;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class BillingService {

    private final OrganizationRepository organizationRepository;
    private final MembershipRepository membershipRepository;
    private final BillingCheckoutRepository checkoutRepository;
    private final SumUpClient sumUpClient;
    private final BillingProperties billingProperties;
    private final Environment environment;
    private final AuditService auditService;
    private final EntitlementService entitlementService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public BillingService(OrganizationRepository organizationRepository,
                          MembershipRepository membershipRepository,
                          BillingCheckoutRepository checkoutRepository,
                          SumUpClient sumUpClient,
                          BillingProperties billingProperties,
                          Environment environment,
                          AuditService auditService,
                          EntitlementService entitlementService) {
        this.organizationRepository = organizationRepository;
        this.membershipRepository = membershipRepository;
        this.checkoutRepository = checkoutRepository;
        this.sumUpClient = sumUpClient;
        this.billingProperties = billingProperties;
        this.environment = environment;
        this.auditService = auditService;
        this.entitlementService = entitlementService;
    }

    @Transactional(readOnly = true)
    public BillingPlanResponse currentPlan() {
        Organization org = requireOrg();
        EntitlementService.QuotaSnapshot snap = entitlementService.snapshot(org.getId());
        return new BillingPlanResponse(
                snap.plan(),
                snap.seatsUsed(),
                snap.seatsLimit(),
                snap.storageNote(),
                snap.storageUsedBytes(),
                snap.storageLimitBytes(),
                snap.aiActionsUsedToday(),
                snap.aiActionsLimitDaily());
    }

    @Transactional
    public BillingPlanResponse updatePlan(UpdateBillingPlanRequest request) {
        if (!allowDirectPlanUpdate()) {
            throw new ApiException(403, "Use SumUp checkout");
        }
        requireOwner();
        Organization org = requireOrg();
        String plan = normalizePlan(request.plan());
        org.setBillingPlan(plan);
        organizationRepository.save(org);
        return currentPlan();
    }

    @Transactional
    public CheckoutResponse createCheckout(CreateCheckoutRequest request) {
        requireOwner();
        Organization org = requireOrg();
        String plan = normalizePlan(request.plan());
        if ("FREE".equals(plan)) {
            throw new ApiException(400, "FREE plan cannot be purchased via checkout");
        }
        Integer amountCents = billingProperties.getSumup().getPrices().get(plan);
        if (amountCents == null || amountCents <= 0) {
            throw new ApiException(400, "Unknown or unpriced plan: " + plan);
        }

        String currency = billingProperties.getSumup().getCurrency();
        String reference = UUID.randomUUID().toString();
        BigDecimal amount = BigDecimal.valueOf(amountCents, 2);

        BillingCheckout checkout = new BillingCheckout();
        checkout.setOrganizationId(org.getId());
        checkout.setPlan(plan);
        checkout.setAmountCents(amountCents);
        checkout.setCurrency(currency);
        checkout.setCheckoutReference(reference);
        checkout.setStatus("PENDING");
        checkoutRepository.save(checkout);

        SumUpCheckoutResult result = sumUpClient.createCheckout(
                amount,
                currency,
                reference,
                "NIHAO " + plan + " subscription");

        checkout.setSumupCheckoutId(result.checkoutId());
        checkout.setHostedCheckoutUrl(result.hostedCheckoutUrl());
        checkoutRepository.save(checkout);

        return toCheckoutResponse(checkout);
    }

    @Transactional(readOnly = true)
    public CheckoutResponse getCheckoutByReference(String reference) {
        requireOwner();
        UUID orgId = SecurityUtils.requireOrganizationId();
        BillingCheckout checkout = checkoutRepository
                .findByCheckoutReferenceAndOrganizationId(reference, orgId)
                .orElseThrow(() -> new ApiException(404, "Checkout not found"));
        return toCheckoutResponse(checkout);
    }

    @Transactional
    public CheckoutResponse completeStubCheckout(String checkoutReference) {
        assertStubCompleteAllowed();
        requireOwner();
        UUID orgId = SecurityUtils.requireOrganizationId();
        BillingCheckout checkout = checkoutRepository
                .findByCheckoutReferenceAndOrganizationId(checkoutReference, orgId)
                .orElseThrow(() -> new ApiException(404, "Checkout not found"));
        markCheckoutPaid(checkout);
        return toCheckoutResponse(checkout);
    }

    @Transactional
    public void handleSumUpWebhook(String rawBody, String signatureHeader) {
        BillingProperties.SumUp cfg = billingProperties.getSumup();
        if (cfg.getWebhookSecret() != null && !cfg.getWebhookSecret().isBlank()) {
            verifyWebhookSignature(rawBody, signatureHeader, cfg.getWebhookSecret());
        }

        JsonNode payload;
        try {
            payload = objectMapper.readTree(rawBody);
        } catch (Exception e) {
            throw new ApiException(400, "Invalid webhook payload");
        }

        String status = textOrNull(payload, "status");
        if (status == null && payload.has("event_type")) {
            status = textOrNull(payload, "event_type");
        }
        if (status == null) {
            return;
        }
        String normalizedStatus = status.trim().toUpperCase(Locale.ROOT);
        if (!normalizedStatus.equals("PAID") && !normalizedStatus.equals("SUCCESSFUL")
                && !normalizedStatus.equals("CHECKOUT_STATUS_CHANGED")) {
            if (payload.has("status")) {
                normalizedStatus = payload.get("status").asText().trim().toUpperCase(Locale.ROOT);
            }
        }
        if (!normalizedStatus.equals("PAID") && !normalizedStatus.equals("SUCCESSFUL")) {
            return;
        }

        String checkoutId = textOrNull(payload, "id");
        if (checkoutId == null) {
            checkoutId = textOrNull(payload, "checkout_id");
        }
        String reference = textOrNull(payload, "checkout_reference");
        if (reference == null) {
            reference = textOrNull(payload, "reference");
        }

        BillingCheckout checkout = null;
        if (checkoutId != null) {
            checkout = checkoutRepository.findBySumupCheckoutId(checkoutId).orElse(null);
        }
        if (checkout == null && reference != null) {
            checkout = checkoutRepository.findByCheckoutReference(reference).orElse(null);
        }
        if (checkout == null) {
            return;
        }
        markCheckoutPaid(checkout);
    }

    private void markCheckoutPaid(BillingCheckout checkout) {
        if ("PAID".equals(checkout.getStatus())) {
            return;
        }
        checkout.setStatus("PAID");
        checkout.setPaidAt(Instant.now());
        checkoutRepository.save(checkout);

        Organization org = organizationRepository.findById(checkout.getOrganizationId())
                .orElseThrow(() -> new ApiException(404, "Organization not found"));
        org.setBillingPlan(checkout.getPlan());
        organizationRepository.save(org);
        UUID actor = null;
        try {
            actor = SecurityUtils.currentUserId();
        } catch (Exception ignored) {
            /* webhook path may have no SecurityContext */
        }
        auditService.logFor(
                checkout.getOrganizationId(),
                actor,
                "BILLING_PAID",
                "BillingCheckout",
                checkout.getId(),
                "plan=" + checkout.getPlan());
    }

    private void verifyWebhookSignature(String rawBody, String signatureHeader, String secret) {
        if (signatureHeader == null || signatureHeader.isBlank()) {
            throw new ApiException(401, "Missing webhook signature");
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8));
            String expected = HexFormat.of().formatHex(digest);
            if (!expected.equalsIgnoreCase(signatureHeader.trim())) {
                throw new ApiException(401, "Invalid webhook signature");
            }
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(401, "Invalid webhook signature");
        }
    }

    private CheckoutResponse toCheckoutResponse(BillingCheckout checkout) {
        return new CheckoutResponse(
                checkout.getId(),
                checkout.getHostedCheckoutUrl(),
                checkout.getPlan(),
                checkout.getAmountCents(),
                checkout.getCurrency(),
                checkout.getStatus(),
                checkout.getCheckoutReference());
    }

    private boolean allowDirectPlanUpdate() {
        if ("stub".equalsIgnoreCase(billingProperties.getProvider())) {
            return true;
        }
        return environment.matchesProfiles("local", "test");
    }

    private void assertStubCompleteAllowed() {
        if (!allowDirectPlanUpdate()) {
            throw new ApiException(403, "Stub checkout completion is only available in local/test or stub billing mode");
        }
    }

    private Organization requireOrg() {
        UUID orgId = SecurityUtils.requireOrganizationId();
        return organizationRepository.findById(orgId)
                .orElseThrow(() -> new ApiException(404, "Organization not found"));
    }

    private void requireOwner() {
        if (SecurityUtils.currentRole() != Role.OWNER) {
            throw new ApiException(403, "Only OWNER can manage billing");
        }
    }

    private static String normalizePlan(String plan) {
        if (plan == null || plan.isBlank()) {
            return "FREE";
        }
        return plan.trim().toUpperCase(Locale.ROOT);
    }

    private static String textOrNull(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) {
            return null;
        }
        return node.get(field).asText();
    }
}
