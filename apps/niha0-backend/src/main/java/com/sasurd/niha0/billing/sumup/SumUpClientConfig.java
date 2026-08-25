package com.sasurd.niha0.billing.sumup;

import com.sasurd.niha0.config.BillingProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class SumUpClientConfig {

    /**
     * When provider is sumup but API key is blank, fall back to stub checkout URLs.
     */
    @Bean
    @Primary
    @ConditionalOnProperty(name = "niha0.billing.provider", havingValue = "sumup", matchIfMissing = true)
    SumUpClient sumUpClientOrStub(BillingProperties billingProperties,
                                  SumUpClientImpl sumUpClientImpl,
                                  StubSumUpClient stubSumUpClient) {
        String apiKey = billingProperties.getSumup().getApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            return stubSumUpClient;
        }
        return sumUpClientImpl;
    }
}
