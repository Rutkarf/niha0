package com.sasurd.niha0.realtime;

import java.util.Map;
import java.util.UUID;

public record RealtimeRedisMessage(UUID organizationId, String eventType, Map<String, Object> payload) {}
