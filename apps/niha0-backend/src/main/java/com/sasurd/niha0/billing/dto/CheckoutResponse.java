package com.sasurd.niha0.billing.dto;

import java.util.UUID;

public record CheckoutResponse(
        UUID checkoutId,
        String hostedCheckoutUrl,
        String plan,
        int amountCents,
        String currency,
        String status,
        String checkoutReference
) {}
