package com.sasurd.niha0.realtime;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sasurd.niha0.config.RealtimeProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class RealtimeEventBroadcaster {

    private final ConcurrentHashMap<UUID, CopyOnWriteArrayList<SseEmitter>> byOrg = new ConcurrentHashMap<>();
    private final RealtimeProperties realtimeProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private StringRedisTemplate redisTemplate;

    public RealtimeEventBroadcaster(RealtimeProperties realtimeProperties) {
        this.realtimeProperties = realtimeProperties;
    }

    @Autowired(required = false)
    public void setRedisTemplate(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public SseEmitter subscribe(UUID organizationId) {
        SseEmitter emitter = new SseEmitter(0L);
        byOrg.computeIfAbsent(organizationId, id -> new CopyOnWriteArrayList<>()).add(emitter);
        emitter.onCompletion(() -> remove(organizationId, emitter));
        emitter.onTimeout(() -> remove(organizationId, emitter));
        emitter.onError(e -> remove(organizationId, emitter));
        try {
            emitter.send(SseEmitter.event().name("connected").data(Map.of("organizationId", organizationId.toString())));
        } catch (IOException ignored) {
            remove(organizationId, emitter);
        }
        return emitter;
    }

    public void broadcast(String eventType, Map<String, Object> payload) {
        if (isRedisMode()) {
            publishRedis(null, eventType, payload);
        } else {
            broadcastLocal(eventType, payload);
        }
    }

    public void broadcastToOrg(UUID organizationId, String eventType, Map<String, Object> payload) {
        if (isRedisMode()) {
            publishRedis(organizationId, eventType, payload);
        } else {
            broadcastToOrgLocal(organizationId, eventType, payload);
        }
    }

    void broadcastLocal(String eventType, Map<String, Object> payload) {
        UUID orgId = extractOrgId(payload);
        if (orgId != null) {
            broadcastToOrgLocal(orgId, eventType, payload);
            return;
        }
        byOrg.forEach((id, list) -> sendAll(list, eventType, payload));
    }

    void broadcastToOrgLocal(UUID organizationId, String eventType, Map<String, Object> payload) {
        CopyOnWriteArrayList<SseEmitter> list = byOrg.get(organizationId);
        if (list == null) {
            return;
        }
        sendAll(list, eventType, payload);
    }

    private void publishRedis(UUID organizationId, String eventType, Map<String, Object> payload) {
        if (redisTemplate == null) {
            if (organizationId != null) {
                broadcastToOrgLocal(organizationId, eventType, payload);
            } else {
                broadcastLocal(eventType, payload);
            }
            return;
        }
        try {
            RealtimeRedisMessage message = new RealtimeRedisMessage(organizationId, eventType, payload);
            redisTemplate.convertAndSend(RedisRealtimeConfig.CHANNEL, objectMapper.writeValueAsString(message));
        } catch (Exception ignored) {
            if (organizationId != null) {
                broadcastToOrgLocal(organizationId, eventType, payload);
            } else {
                broadcastLocal(eventType, payload);
            }
        }
    }

    private boolean isRedisMode() {
        return "redis".equalsIgnoreCase(realtimeProperties.getMode());
    }

    private static UUID extractOrgId(Map<String, Object> payload) {
        Object raw = payload.get("organizationId");
        if (raw instanceof UUID uuid) {
            return uuid;
        }
        if (raw instanceof String s) {
            try {
                return UUID.fromString(s);
            } catch (IllegalArgumentException ignored) {
                return null;
            }
        }
        return null;
    }

    private void sendAll(CopyOnWriteArrayList<SseEmitter> list, String eventType, Map<String, Object> payload) {
        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event().name(eventType).data(payload));
            } catch (IOException e) {
                list.remove(emitter);
            }
        }
    }

    private void remove(UUID organizationId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> list = byOrg.get(organizationId);
        if (list != null) {
            list.remove(emitter);
        }
    }
}
