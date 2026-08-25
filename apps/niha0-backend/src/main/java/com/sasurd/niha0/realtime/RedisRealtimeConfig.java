package com.sasurd.niha0.realtime;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sasurd.niha0.config.RealtimeProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.util.StringUtils;

@Configuration
@ConditionalOnProperty(name = "niha0.realtime.mode", havingValue = "redis")
public class RedisRealtimeConfig {

    public static final String CHANNEL = "niha0-realtime";

    @Bean
    RedisConnectionFactory redisConnectionFactory(RealtimeProperties properties) {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        if (StringUtils.hasText(properties.getRedisUrl())) {
            parseRedisUrl(properties.getRedisUrl(), config);
        } else {
            String host = System.getenv("SPRING_DATA_REDIS_HOST");
            config.setHostName(host != null && !host.isBlank() ? host : "localhost");
            String port = System.getenv("SPRING_DATA_REDIS_PORT");
            if (port != null && !port.isBlank()) {
                config.setPort(Integer.parseInt(port));
            }
        }
        return new LettuceConnectionFactory(config);
    }

    @Bean
    StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        return new StringRedisTemplate(connectionFactory);
    }

    @Bean
    RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory connectionFactory,
            RealtimeEventBroadcaster broadcaster) {
        ObjectMapper objectMapper = new ObjectMapper();
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener((message, pattern) -> {
            try {
                String json = new String(message.getBody());
                RealtimeRedisMessage event = objectMapper.readValue(json, RealtimeRedisMessage.class);
                if (event.organizationId() != null) {
                    broadcaster.broadcastToOrgLocal(
                            event.organizationId(), event.eventType(), event.payload());
                } else {
                    broadcaster.broadcastLocal(event.eventType(), event.payload());
                }
            } catch (Exception ignored) {
                // skip malformed messages
            }
        }, new PatternTopic(CHANNEL));
        return container;
    }

    private static void parseRedisUrl(String url, RedisStandaloneConfiguration config) {
        String normalized = url.startsWith("redis://") ? url.substring("redis://".length()) : url;
        int slash = normalized.indexOf('/');
        if (slash >= 0) {
            normalized = normalized.substring(0, slash);
        }
        String[] hostPort = normalized.split(":");
        config.setHostName(hostPort[0]);
        if (hostPort.length > 1) {
            config.setPort(Integer.parseInt(hostPort[1]));
        }
    }
}
