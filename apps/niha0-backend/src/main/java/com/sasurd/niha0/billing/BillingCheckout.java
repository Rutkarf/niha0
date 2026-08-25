package com.sasurd.niha0.billing;

import com.sasurd.niha0.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "billing_checkouts")
@Getter
@Setter
public class BillingCheckout extends AuditableEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(nullable = false, length = 32)
    private String plan;

    @Column(name = "amount_cents", nullable = false)
    private int amountCents;

    @Column(nullable = false, length = 8)
    private String currency = "EUR";

    @Column(name = "sumup_checkout_id", length = 128)
    private String sumupCheckoutId;

    @Column(name = "checkout_reference", nullable = false, unique = true, length = 128)
    private String checkoutReference;

    @Column(nullable = false, length = 32)
    private String status = "PENDING";

    @Column(name = "hosted_checkout_url", length = 2048)
    private String hostedCheckoutUrl;

    @Column(name = "paid_at")
    private Instant paidAt;
}
