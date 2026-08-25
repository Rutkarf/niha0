package com.sasurd.niha0.billing;

import com.sasurd.niha0.billing.dto.BillingPlanResponse;
import com.sasurd.niha0.billing.dto.CheckoutResponse;
import com.sasurd.niha0.billing.dto.CreateCheckoutRequest;
import com.sasurd.niha0.billing.dto.StubCompleteRequest;
import com.sasurd.niha0.billing.dto.UpdateBillingPlanRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/billing")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @GetMapping("/plan")
    public BillingPlanResponse currentPlan() {
        return billingService.currentPlan();
    }

    @PostMapping("/plan")
    @PreAuthorize("hasRole('OWNER')")
    public BillingPlanResponse updatePlan(@Valid @RequestBody UpdateBillingPlanRequest request) {
        return billingService.updatePlan(request);
    }

    @PostMapping("/checkouts")
    @PreAuthorize("hasRole('OWNER')")
    public CheckoutResponse createCheckout(@Valid @RequestBody CreateCheckoutRequest request) {
        return billingService.createCheckout(request);
    }

    @GetMapping("/checkouts/{reference}")
    @PreAuthorize("hasRole('OWNER')")
    public CheckoutResponse getCheckout(@PathVariable String reference) {
        return billingService.getCheckoutByReference(reference);
    }

    @PostMapping("/stub-complete")
    @PreAuthorize("hasRole('OWNER')")
    public CheckoutResponse stubComplete(@Valid @RequestBody StubCompleteRequest request) {
        return billingService.completeStubCheckout(request.checkoutReference());
    }

    @PostMapping("/webhooks/sumup")
    public void sumUpWebhook(HttpServletRequest request,
                             @RequestHeader(value = "x-payload-signature", required = false) String signature)
            throws IOException {
        String rawBody = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        billingService.handleSumUpWebhook(rawBody, signature);
    }
}
