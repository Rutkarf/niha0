package com.sasurd.niha0.tenancy;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Sets PostgreSQL {@code app.organization_id} for Row Level Security (Flyway V15).
 * Safe no-op on H2 / when the GUC is unavailable.
 */
@Component
public class TenantRlsSupport {

    private static final Logger log = LoggerFactory.getLogger(TenantRlsSupport.class);

    private final JdbcTemplate jdbcTemplate;

    public TenantRlsSupport(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void applyOrganization(UUID organizationId) {
        if (organizationId == null) {
            return;
        }
        try {
            jdbcTemplate.queryForObject(
                    "SELECT set_config('app.organization_id', ?, true)",
                    String.class,
                    organizationId.toString());
        } catch (Exception e) {
            log.trace("RLS session GUC skipped: {}", e.getMessage());
        }
    }
}
