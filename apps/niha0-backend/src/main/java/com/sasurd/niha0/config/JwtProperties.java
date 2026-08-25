package com.sasurd.niha0.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "niha0.jwt")
public class JwtProperties {

    /** Current signing secret (required). */
    private String secret;

    /**
     * Previous secret for zero-downtime rotation — tokens signed with this key
     * remain valid until they expire. Set {@code JWT_PREVIOUS_SECRET} during rotation.
     */
    private String previousSecret;

    private long accessTokenExpirationMs = 3_600_000L;
    private long refreshTokenExpirationMs = 604_800_000L;
}
