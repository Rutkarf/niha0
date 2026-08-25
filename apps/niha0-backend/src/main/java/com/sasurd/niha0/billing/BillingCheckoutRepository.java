package com.sasurd.niha0.billing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BillingCheckoutRepository extends JpaRepository<BillingCheckout, UUID> {

    Optional<BillingCheckout> findByCheckoutReference(String checkoutReference);

    Optional<BillingCheckout> findByCheckoutReferenceAndOrganizationId(String checkoutReference, UUID organizationId);

    Optional<BillingCheckout> findBySumupCheckoutId(String sumupCheckoutId);
}
