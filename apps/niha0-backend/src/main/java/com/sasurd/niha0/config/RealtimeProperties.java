package com.sasurd.niha0.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "niha0.realtime")
public class RealtimeProperties {

    private String mode = "memory";
    private String redisUrl = "";
}
