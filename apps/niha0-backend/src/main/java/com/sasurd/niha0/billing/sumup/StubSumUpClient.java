package com.sasurd.niha0.billing.sumup;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class StubSumUpClient implements SumUpClient {

    @Override
    public SumUpCheckoutResult createCheckout(
            BigDecimal amount,
            String currency,
            String checkoutReference,
            String description) {
        String url = "http://localhost:4200/app/settings?billing=stub&ref=" + checkoutReference;
        return new SumUpCheckoutResult("stub-" + checkoutReference, url);
    }
}
