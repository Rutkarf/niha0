package com.sasurd.niha0.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "niha0.billing")
public class BillingProperties {

    private String provider = "sumup";
    private SumUp sumup = new SumUp();

    @Getter
    @Setter
    public static class SumUp {
        private String apiBase = "https://api.sumup.com";
        private String apiKey = "";
        private String merchantCode = "";
        private String webhookSecret = "";
        private String currency = "EUR";
        private String redirectUrl = "http://localhost:4200/app/settings?billing=success";
        private Map<String, Integer> prices = new HashMap<>(Map.of(
                "PRO", 4900,
                "BUSINESS", 14900
        ));
    }
}
