package com.sasurd.niha0.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
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
import java.util.concurrent.TimeUnit;

/**
 * Rate limiter for sensitive auth endpoints.
 * Uses Redis when {@link StringRedisTemplate} is available; otherwise in-memory.
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
    private final ObjectProvider<StringRedisTemplate> redisTemplate;
    private final boolean enabled;

    public AuthRateLimitFilter(
            ObjectProvider<StringRedisTemplate> redisTemplate,
            @Value("${niha0.security.auth-rate-limit-enabled:true}") boolean enabled) {
        this.redisTemplate = redisTemplate;
        this.enabled = enabled;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!enabled) {
            return true;
        }
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
        String key = "niha0:auth-rl:" + clientKey(request) + "|" + bucket(path);

        if (!tryAcquire(key, max)) {
            response.sendError(429, "Too many authentication attempts. Try again later.");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private boolean tryAcquire(String key, int max) {
        StringRedisTemplate redis = redisTemplate.getIfAvailable();
        if (redis != null) {
            try {
                Long count = redis.opsForValue().increment(key);
                if (count != null && count == 1L) {
                    redis.expire(key, WINDOW.toSeconds(), TimeUnit.SECONDS);
                }
                return count == null || count <= max;
            } catch (Exception ignored) {
                // Fall back to memory if Redis is misconfigured
            }
        }
        long now = System.currentTimeMillis();
        Deque<Long> window = attempts.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (window) {
            prune(window, now);
            if (window.size() >= max) {
                return false;
            }
            window.addLast(now);
            return true;
        }
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
