package com.sasurd.niha0.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory rate limiter for sensitive auth endpoints (brute-force / stuffing).
 * Limits are per client IP; not distributed — use Redis gateway in multi-instance prod.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_ATTEMPTS = 30;
    private static final int MAX_MFA_ATTEMPTS = 20;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private static final Set<String> AUTH_PATHS = Set.of(
            "/auth/login",
            "/auth/register",
            "/auth/forgot-password",
            "/auth/reset-password",
            "/auth/accept-invite",
            "/auth/refresh",
            "/auth/mfa/verify"
    );

    private final ConcurrentHashMap<String, Deque<Long>> attempts = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!HttpMethod.POST.matches(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        if (path == null) {
            return true;
        }
        String normalized = path.contains("/api/") ? path.substring(path.indexOf("/api/") + 4) : path;
        if (!normalized.startsWith("/")) {
            normalized = "/" + normalized;
        }
        return AUTH_PATHS.stream().noneMatch(normalized::endsWith)
                && AUTH_PATHS.stream().noneMatch(normalized::contains);
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI() == null ? "" : request.getRequestURI();
        int max = path.contains("/mfa/") ? MAX_MFA_ATTEMPTS : MAX_ATTEMPTS;
        String key = clientKey(request) + "|" + bucket(path);
        long now = System.currentTimeMillis();
        Deque<Long> window = attempts.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (window) {
            prune(window, now);
            if (window.size() >= max) {
                response.sendError(429, "Too many authentication attempts. Try again later.");
                return;
            }
            window.addLast(now);
        }
        filterChain.doFilter(request, response);
    }

    private static String bucket(String path) {
        if (path.contains("/mfa/")) return "mfa";
        if (path.contains("/refresh")) return "refresh";
        if (path.contains("/login") || path.contains("/register")) return "login";
        return "auth";
    }

    private void prune(Deque<Long> window, long now) {
        long cutoff = now - WINDOW.toMillis();
        while (!window.isEmpty() && window.peekFirst() < cutoff) {
            window.removeFirst();
        }
    }

    private String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
