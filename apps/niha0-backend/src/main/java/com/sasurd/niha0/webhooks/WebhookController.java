package com.sasurd.niha0.webhooks;

import com.sasurd.niha0.webhooks.dto.CreateWebhookRequest;
import com.sasurd.niha0.webhooks.dto.WebhookResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/webhooks")
@PreAuthorize("hasAnyRole('OWNER','ADMIN')")
public class WebhookController {

    private final WebhookService webhookService;

    public WebhookController(WebhookService webhookService) {
        this.webhookService = webhookService;
    }

    @GetMapping
    public List<WebhookResponse> list() {
        return webhookService.list();
    }

    @PostMapping
    public WebhookResponse create(@Valid @RequestBody CreateWebhookRequest request) {
        return webhookService.create(request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        webhookService.delete(id);
    }
}
