package com.sasurd.niha0.realtime;

import com.sasurd.niha0.security.Niha0UserDetails;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/realtime")
public class RealtimeController {

    private final RealtimeEventBroadcaster broadcaster;
    private final SseTicketService sseTicketService;

    public RealtimeController(RealtimeEventBroadcaster broadcaster, SseTicketService sseTicketService) {
        this.broadcaster = broadcaster;
        this.sseTicketService = sseTicketService;
    }

    /**
     * Issues a short-lived one-time ticket for EventSource.
     * Requires Bearer JWT — never put the JWT in the SSE URL.
     */
    @PostMapping("/ticket")
    public Map<String, Object> issueTicket() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Niha0UserDetails user)) {
            throw new com.sasurd.niha0.common.ApiException(401, "Authentication required");
        }
        String ticket = sseTicketService.issue(
                user.getUserId(),
                user.getOrganizationId(),
                user.getUsername(),
                user.getRole());
        return Map.of(
                "ticket", ticket,
                "expiresInMs", sseTicketService.ttlSeconds() * 1000L);
    }

    @GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter events() {
        UUID orgId = SecurityUtils.requireOrganizationId();
        return broadcaster.subscribe(orgId);
    }
}
