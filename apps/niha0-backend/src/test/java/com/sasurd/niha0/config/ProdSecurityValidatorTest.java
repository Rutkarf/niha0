package com.sasurd.niha0.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProdSecurityValidatorTest {

    @Test
    void passesWithHardenedSettings() {
        ProdSecurityValidator validator = new ProdSecurityValidator(
                new MockEnvironment(),
                "production-grade-jwt-secret-with-at-least-forty-eight-chars!!",
                "https://app.example.com",
                "strong-db-password-xyz",
                "minio",
                false,
                "openai",
                false,
                "smtp",
                "sumup",
                "sup_sk_test",
                "https://app.example.com");
        assertThatCode(() -> validator.run(null)).doesNotThrowAnyException();
    }

    @Test
    void rejectsMockAiInProd() {
        ProdSecurityValidator validator = new ProdSecurityValidator(
                new MockEnvironment(),
                "production-grade-jwt-secret-with-at-least-forty-eight-chars!!",
                "https://app.example.com",
                "strong-db-password-xyz",
                "minio",
                false,
                "mock",
                false,
                "smtp",
                "stub",
                "",
                "https://app.example.com");
        assertThatThrownBy(() -> validator.run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("AI_PROVIDER=mock");
    }

    @Test
    void rejectsDemoLoginEnabled() {
        ProdSecurityValidator validator = new ProdSecurityValidator(
                new MockEnvironment(),
                "production-grade-jwt-secret-with-at-least-forty-eight-chars!!",
                "https://app.example.com",
                "strong-db-password-xyz",
                "s3",
                true,
                "openai",
                false,
                "smtp",
                "stub",
                "",
                "https://app.example.com");
        assertThatThrownBy(() -> validator.run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("DEMO_LOGIN_ENABLED");
    }
}
