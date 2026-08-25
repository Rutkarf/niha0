package com.sasurd.niha0.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PostgresJdbcUrlEnvironmentPostProcessorTest {

    @Test
    void convertsPostgresScheme() {
        assertEquals(
                "jdbc:postgresql://u:p@host:5432/niha0",
                PostgresJdbcUrlEnvironmentPostProcessor.toJdbcPostgresql("postgres://u:p@host:5432/niha0"));
    }

    @Test
    void leavesJdbcUnchanged() {
        assertEquals(
                "jdbc:postgresql://localhost:5432/niha0",
                PostgresJdbcUrlEnvironmentPostProcessor.toJdbcPostgresql("jdbc:postgresql://localhost:5432/niha0"));
    }
}
