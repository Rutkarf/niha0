package com.sasurd.niha0.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "niha0.app")
public class AppProperties {

    private String publicUrl = "http://localhost:4200";
}
