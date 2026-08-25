package com.sasurd.niha0.identity;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * On prod/staging profile, deactivate known Flyway demo accounts so Demo2026!
 * cannot be used even if DEMO_LOGIN_ENABLED is misconfigured later.
 */
@Component
@Profile("prod")
public class DemoUserDeactivator implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoUserDeactivator.class);

    private static final String[] DEMO_EMAILS = {
            "rutkarf@optimustest.fr",
            "sales@optimustest.fr",
            "support@optimustest.fr",
            "ceo@tenant-isolation.fr",
            "ceo@nova-atelier.fr",
            "sales@nova-atelier.fr",
            "support@nova-atelier.fr",
            "ceo@rival-studio.fr"
    };

    private final JdbcTemplate jdbc;

    public DemoUserDeactivator(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        int updated = jdbc.update("""
                UPDATE users
                SET active = FALSE,
                    mfa_enabled = FALSE,
                    mfa_secret = NULL
                WHERE lower(email) IN (?,?,?,?,?,?,?,?)
                  AND active = TRUE
                """, (Object[]) DEMO_EMAILS);
        if (updated > 0) {
            log.warn("Deactivated {} Flyway demo user(s) for production hardening", updated);
        } else {
            log.info("No active Flyway demo users to deactivate");
        }
    }
}
