package com.sasurd.niha0.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Fails fast in production when secrets / CORS / JWT are unsafe.
 */
@Component
@Profile("prod")
public class ProdSecurityValidator implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ProdSecurityValidator.class);

    private static final String WEAK_DEFAULT =
            "niha0-dev-secret-change-in-production-min-256-bits-long-key!!";

    private final Environment environment;
    private final String jwtSecret;
    private final String corsOrigins;
    private final String datasourcePassword;
    private final String storageMode;

    public ProdSecurityValidator(
            Environment environment,
            @Value("${niha0.jwt.secret:}") String jwtSecret,
            @Value("${niha0.cors.allowed-origins:}") String corsOrigins,
            @Value("${spring.datasource.password:}") String datasourcePassword,
            @Value("${niha0.storage.mode:local}") String storageMode) {
        this.environment = environment;
        this.jwtSecret = jwtSecret == null ? "" : jwtSecret;
        this.corsOrigins = corsOrigins == null ? "" : corsOrigins;
        this.datasourcePassword = datasourcePassword == null ? "" : datasourcePassword;
        this.storageMode = storageMode == null ? "local" : storageMode;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (jwtSecret.isBlank()) {
            fail("JWT_SECRET is required in prod (niha0.jwt.secret)");
        }
        if (jwtSecret.equals(WEAK_DEFAULT) || jwtSecret.length() < 48) {
            fail("JWT_SECRET is too weak for production (min 48 chars, not the local default)");
        }
        if (corsOrigins.contains("*")) {
            fail("CORS allowed-origins must not use wildcard (*) in production");
        }
        if (datasourcePassword.isBlank() || "niha0".equals(datasourcePassword) || "password".equalsIgnoreCase(datasourcePassword)) {
            fail("Database password must be set to a non-default value in production");
        }
        if ("local".equalsIgnoreCase(storageMode)) {
            fail("niha0.storage.mode=local is forbidden in production; use s3 or minio");
        }
        log.info("Production security checks passed (profiles={})",
                String.join(",", environment.getActiveProfiles()));
    }

    private void fail(String message) {
        throw new IllegalStateException("PROD SECURITY: " + message);
    }
}
