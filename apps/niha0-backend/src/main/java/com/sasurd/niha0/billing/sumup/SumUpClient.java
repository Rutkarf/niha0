package com.sasurd.niha0.billing.sumup;

import java.math.BigDecimal;

public interface SumUpClient {

    SumUpCheckoutResult createCheckout(
            BigDecimal amount,
            String currency,
            String checkoutReference,
            String description);
}
