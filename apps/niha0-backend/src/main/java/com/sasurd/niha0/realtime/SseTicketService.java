package com.sasurd.niha0.realtime;

import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.common.Role;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Short-lived, single-use tickets for EventSource SSE auth.
 * EventSource cannot set Authorization headers; JWT must never appear in query strings.
 */
@Service
public class SseTicketService {

    private static final long TTL_SECONDS = 30;

    public record TicketClaims(UUID userId, UUID organizationId, String email, Role role) {}

    private record StoredTicket(TicketClaims claims, Instant expiresAt) {}

    private final Map<String, StoredTicket> tickets = new ConcurrentHashMap<>();

    public String issue(UUID userId, UUID organizationId, String email, Role role) {
        purgeExpired();
        String ticket = UUID.randomUUID().toString();
        tickets.put(
                ticket,
                new StoredTicket(
                        new TicketClaims(userId, organizationId, email, role),
                        Instant.now().plusSeconds(TTL_SECONDS)));
        return ticket;
    }

    /** Consumes the ticket (one-time). Returns null if missing/expired. */
    public TicketClaims consume(String ticket) {
        if (ticket == null || ticket.isBlank()) {
            return null;
        }
        StoredTicket stored = tickets.remove(ticket.trim());
        if (stored == null) {
            return null;
        }
        if (Instant.now().isAfter(stored.expiresAt())) {
            return null;
        }
        return stored.claims();
    }

    public long ttlSeconds() {
        return TTL_SECONDS;
    }

    public void assertValidForIssue() {
        // no-op hook for future rate limiting
    }

    public TicketClaims requireConsume(String ticket) {
        TicketClaims claims = consume(ticket);
        if (claims == null) {
            throw new ApiException(401, "Invalid or expired SSE ticket");
        }
        return claims;
    }

    private void purgeExpired() {
        Instant now = Instant.now();
        tickets.entrySet().removeIf(e -> now.isAfter(e.getValue().expiresAt()));
    }
}
