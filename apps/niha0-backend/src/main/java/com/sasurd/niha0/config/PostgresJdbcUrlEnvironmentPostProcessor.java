package com.sasurd.niha0.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

/**
 * Render (and Heroku-style) DATABASE_URL uses {@code postgres://}; Spring JDBC needs
 * {@code jdbc:postgresql://}. Also rewrites {@code SPRING_DATASOURCE_URL} when needed.
 */
public class PostgresJdbcUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> overrides = new HashMap<>();

        String springUrl = environment.getProperty("SPRING_DATASOURCE_URL");
        String databaseUrl = environment.getProperty("DATABASE_URL");

        String candidate = firstNonBlank(springUrl, databaseUrl);
        if (candidate == null) {
            return;
        }
        String jdbc = toJdbcPostgresql(candidate);
        if (!jdbc.equals(candidate) || (springUrl == null || springUrl.isBlank())) {
            overrides.put("spring.datasource.url", jdbc);
            overrides.put("SPRING_DATASOURCE_URL", jdbc);
        }

        if (!overrides.isEmpty()) {
            environment.getPropertySources().addFirst(new MapPropertySource("niha0JdbcUrlNormalize", overrides));
        }
    }

    static String toJdbcPostgresql(String url) {
        if (url.startsWith("jdbc:")) {
            return url;
        }
        if (url.startsWith("postgres://")) {
            return "jdbc:postgresql://" + url.substring("postgres://".length());
        }
        if (url.startsWith("postgresql://")) {
            return "jdbc:postgresql://" + url.substring("postgresql://".length());
        }
        return url;
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) return a;
        if (b != null && !b.isBlank()) return b;
        return null;
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}
