package com.sasurd.niha0.webhooks;

import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.common.Role;
import com.sasurd.niha0.security.SecurityUtils;
import com.sasurd.niha0.webhooks.dto.CreateWebhookRequest;
import com.sasurd.niha0.webhooks.dto.WebhookResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class WebhookService {

    private final OutboundWebhookRepository webhookRepository;

    public WebhookService(OutboundWebhookRepository webhookRepository) {
        this.webhookRepository = webhookRepository;
    }

    @Transactional(readOnly = true)
    public List<WebhookResponse> list() {
        requireOwnerOrAdmin();
        UUID orgId = SecurityUtils.requireOrganizationId();
        return webhookRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public WebhookResponse create(CreateWebhookRequest request) {
        requireOwnerOrAdmin();
        OutboundWebhook webhook = new OutboundWebhook();
        webhook.setOrganizationId(SecurityUtils.requireOrganizationId());
        webhook.setUrl(request.url().trim());
        webhook.setSecret(request.secret());
        webhook.setEvents(request.events().trim());
        webhook.setActive(true);
        return toResponse(webhookRepository.save(webhook));
    }

    @Transactional
    public void delete(UUID id) {
        requireOwnerOrAdmin();
        UUID orgId = SecurityUtils.requireOrganizationId();
        OutboundWebhook webhook = webhookRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ApiException(404, "Webhook not found"));
        webhookRepository.delete(webhook);
    }

    private WebhookResponse toResponse(OutboundWebhook webhook) {
        return new WebhookResponse(
                webhook.getId(),
                webhook.getUrl(),
                webhook.getEvents(),
                webhook.isActive(),
                webhook.getCreatedAt());
    }

    private void requireOwnerOrAdmin() {
        Role role = SecurityUtils.currentRole();
        if (role != Role.OWNER && role != Role.ADMIN) {
            throw new ApiException(403, "Only OWNER or ADMIN can manage webhooks");
        }
    }
}
