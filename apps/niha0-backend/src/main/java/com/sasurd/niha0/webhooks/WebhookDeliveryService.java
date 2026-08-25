package com.sasurd.niha0.webhooks;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sasurd.niha0.common.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class WebhookDeliveryService {

    private static final Logger log = LoggerFactory.getLogger(WebhookDeliveryService.class);
    private static final int MAX_ATTEMPTS = 8;

    private final OutboundWebhookRepository webhookRepository;
    private final WebhookDeliveryRepository deliveryRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient = RestClient.create();

    public WebhookDeliveryService(OutboundWebhookRepository webhookRepository,
                                  WebhookDeliveryRepository deliveryRepository) {
        this.webhookRepository = webhookRepository;
        this.deliveryRepository = deliveryRepository;
    }

    @Transactional
    public void enqueue(UUID organizationId, String eventType, Map<String, Object> payload) {
        List<OutboundWebhook> webhooks = webhookRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId);
        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            throw new ApiException(500, "Failed to serialize webhook payload");
        }

        for (OutboundWebhook webhook : webhooks) {
            if (!webhook.isActive()) {
                continue;
            }
            if (!matchesEvent(webhook.getEvents(), eventType)) {
                continue;
            }
            WebhookDelivery delivery = new WebhookDelivery();
            delivery.setWebhookId(webhook.getId());
            delivery.setOrganizationId(organizationId);
            delivery.setEventType(eventType);
            delivery.setPayloadJson(payloadJson);
            delivery.setStatus("PENDING");
            delivery.setNextAttemptAt(Instant.now());
            deliveryRepository.save(delivery);
        }
    }

    @Scheduled(fixedDelay = 15000)
    @Transactional
    public void processPendingDeliveries() {
        List<WebhookDelivery> due = deliveryRepository.findDuePending(Instant.now());
        for (WebhookDelivery delivery : due) {
            deliverOne(delivery);
        }
    }

    private void deliverOne(WebhookDelivery delivery) {
        OutboundWebhook webhook = webhookRepository.findById(delivery.getWebhookId()).orElse(null);
        if (webhook == null || !webhook.isActive()) {
            delivery.setStatus("FAILED");
            delivery.setLastError("Webhook not found or inactive");
            deliveryRepository.save(delivery);
            return;
        }

        try {
            String signature = hmacSha256Hex(delivery.getPayloadJson(), webhook.getSecret());
            restClient.post()
                    .uri(webhook.getUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Niha0-Signature", signature)
                    .body(delivery.getPayloadJson())
                    .retrieve()
                    .toBodilessEntity();

            delivery.setStatus("DELIVERED");
            delivery.setDeliveredAt(Instant.now());
            delivery.setLastError(null);
            deliveryRepository.save(delivery);
        } catch (Exception e) {
            delivery.setAttempts(delivery.getAttempts() + 1);
            delivery.setLastError(e.getMessage());
            if (delivery.getAttempts() >= MAX_ATTEMPTS) {
                delivery.setStatus("FAILED");
            } else {
                long delaySeconds = Math.min(15L * (1L << delivery.getAttempts()), 3600L);
                delivery.setNextAttemptAt(Instant.now().plusSeconds(delaySeconds));
            }
            deliveryRepository.save(delivery);
            log.warn("Webhook delivery {} failed (attempt {}): {}",
                    delivery.getId(), delivery.getAttempts(), e.getMessage());
        }
    }

    private static boolean matchesEvent(String eventsCsv, String eventType) {
        if (eventsCsv == null || eventsCsv.isBlank()) {
            return false;
        }
        for (String part : eventsCsv.split(",")) {
            String trimmed = part.trim();
            if ("*".equals(trimmed) || eventType.equalsIgnoreCase(trimmed)) {
                return true;
            }
        }
        return false;
    }

    private static String hmacSha256Hex(String body, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new ApiException(500, "Failed to sign webhook payload");
        }
    }
}
