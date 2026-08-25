package com.sasurd.niha0.security;

import com.sasurd.niha0.common.Role;
import com.sasurd.niha0.realtime.SseTicketService;
import com.sasurd.niha0.tenancy.TenantContext;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final SseTicketService sseTicketService;

    public JwtAuthFilter(JwtService jwtService, SseTicketService sseTicketService) {
        this.jwtService = jwtService;
        this.sseTicketService = sseTicketService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        try {
            SseTicketOutcome sse = authenticateSseTicket(request, response);
            if (sse == SseTicketOutcome.REJECTED) {
                return;
            }
            if (sse == SseTicketOutcome.AUTHENTICATED) {
                filterChain.doFilter(request, response);
                return;
            }

            String token = extractBearerToken(request);
            if (token != null) {
                try {
                    Claims claims = jwtService.parseClaims(token);
                    UUID userId = jwtService.extractUserId(claims);
                    UUID organizationId = jwtService.extractOrganizationId(claims);
                    Role role = jwtService.extractRole(claims);
                    String email = claims.getSubject();
                    setAuthentication(request, userId, organizationId, email, role);
                } catch (Exception e) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired token");
                    return;
                }
            }
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
            SecurityContextHolder.clearContext();
        }
    }

    private enum SseTicketOutcome { NOT_APPLICABLE, AUTHENTICATED, REJECTED }

    /**
     * EventSource cannot send Authorization headers. Clients obtain a one-time ticket
     * via POST /realtime/ticket (Bearer JWT) then connect with ?ticket=…
     * JWT in query string is no longer accepted.
     */
    private SseTicketOutcome authenticateSseTicket(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        String path = request.getRequestURI();
        if (path == null || !path.contains("/realtime/events")) {
            return SseTicketOutcome.NOT_APPLICABLE;
        }
        if (request.getParameter("token") != null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED,
                    "JWT query parameter is not allowed; obtain an SSE ticket via POST /realtime/ticket");
            return SseTicketOutcome.REJECTED;
        }
        String ticket = request.getParameter("ticket");
        if (ticket == null || ticket.isBlank()) {
            return SseTicketOutcome.NOT_APPLICABLE;
        }
        SseTicketService.TicketClaims claims = sseTicketService.consume(ticket);
        if (claims == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired SSE ticket");
            return SseTicketOutcome.REJECTED;
        }
        setAuthentication(request, claims.userId(), claims.organizationId(), claims.email(), claims.role());
        return SseTicketOutcome.AUTHENTICATED;
    }

    private void setAuthentication(HttpServletRequest request,
                                   UUID userId,
                                   UUID organizationId,
                                   String email,
                                   Role role) {
        TenantContext.set(organizationId, userId);
        Niha0UserDetails userDetails = new Niha0UserDetails(
                userId, organizationId, email, "", role, true);
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private String extractBearerToken(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
