package com.sasurd.niha0.billing.sumup;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.config.BillingProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;

@Component
@ConditionalOnProperty(name = "niha0.billing.provider", havingValue = "sumup", matchIfMissing = true)
public class SumUpClientImpl implements SumUpClient {

    private final BillingProperties billingProperties;
    private final RestClient restClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SumUpClientImpl(BillingProperties billingProperties) {
        this.billingProperties = billingProperties;
        this.restClient = RestClient.builder()
                .baseUrl(billingProperties.getSumup().getApiBase())
                .build();
    }

    @Override
    public SumUpCheckoutResult createCheckout(
            BigDecimal amount,
            String currency,
            String checkoutReference,
            String description) {
        BillingProperties.SumUp cfg = billingProperties.getSumup();
        if (cfg.getApiKey() == null || cfg.getApiKey().isBlank()) {
            throw new ApiException(503, "SumUp API key not configured");
        }
        if (cfg.getMerchantCode() == null || cfg.getMerchantCode().isBlank()) {
            throw new ApiException(503, "SumUp merchant code not configured");
        }

        String body;
        try {
            body = objectMapper.writeValueAsString(java.util.Map.of(
                    "amount", amount,
                    "currency", currency,
                    "checkout_reference", checkoutReference,
                    "description", description,
                    "merchant_code", cfg.getMerchantCode(),
                    "redirect_url", cfg.getRedirectUrl(),
                    "hosted_checkout", java.util.Map.of("enabled", true)));
        } catch (Exception e) {
            throw new ApiException(500, "Failed to build SumUp checkout request");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(cfg.getApiKey());

        String responseBody = restClient.post()
                .uri("/v0.1/checkouts")
                .headers(h -> {
                    h.addAll(headers);
                })
                .body(body)
                .retrieve()
                .body(String.class);

        try {
            JsonNode json = objectMapper.readTree(responseBody);
            String id = textOrNull(json, "id");
            String hostedUrl = textOrNull(json, "hosted_checkout_url");
            if (hostedUrl == null && json.has("hosted_checkout")) {
                hostedUrl = textOrNull(json.get("hosted_checkout"), "url");
            }
            if (id == null || hostedUrl == null) {
                throw new ApiException(502, "Unexpected SumUp checkout response");
            }
            return new SumUpCheckoutResult(id, hostedUrl);
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(502, "Failed to parse SumUp checkout response");
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) {
            return null;
        }
        return node.get(field).asText();
    }
}
