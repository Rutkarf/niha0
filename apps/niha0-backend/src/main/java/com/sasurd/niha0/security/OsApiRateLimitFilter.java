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
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Soft rate-limit for expensive OS-layer POSTs (chat, runtime, guardrail scan).
 */
@Component
public class OsApiRateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_ATTEMPTS = 60;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final ConcurrentHashMap<String, Deque<Long>> attempts = new ConcurrentHashMap<>();
    private final ObjectProvider<StringRedisTemplate> redisTemplate;
    private final boolean enabled;

    public OsApiRateLimitFilter(
            ObjectProvider<StringRedisTemplate> redisTemplate,
            @Value("${niha0.security.os-api-rate-limit-enabled:true}") boolean enabled) {
        this.redisTemplate = redisTemplate;
        this.enabled = enabled;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!enabled || !HttpMethod.POST.matches(request.getMethod())) {
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
        final String n = normalized;
        boolean chatMessage = n.matches(".*/chat/threads/[^/]+/messages$");
        boolean runtimeStart = n.endsWith("/agents/runtime/start");
        boolean scan = n.endsWith("/governance/guardrails/scan");
        boolean newThread = n.endsWith("/chat/threads");
        return !(chatMessage || runtimeStart || scan || newThread);
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String key = "niha0:os-rl:" + clientKey(request);
        if (!tryAcquire(key, MAX_ATTEMPTS)) {
            response.sendError(429, "Too many OS API requests. Try again later.");
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
                // fall through
            }
        }
        long now = System.currentTimeMillis();
        Deque<Long> window = attempts.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (window) {
            long cutoff = now - WINDOW.toMillis();
            while (!window.isEmpty() && window.peekFirst() < cutoff) {
                window.removeFirst();
            }
            if (window.size() >= max) {
                return false;
            }
            window.addLast(now);
            return true;
        }
    }

    private String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }
}
