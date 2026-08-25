package com.sasurd.niha0.identity;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class MailTemplateRendererTest {

    @Test
    void rendersPasswordResetWithPlaceholders() throws Exception {
        MailTemplateRenderer renderer = new MailTemplateRenderer();
        String html = renderer.render("password-reset", Map.of(
                "email", "pilot@example.com",
                "actionUrl", "https://app.example.com/reset-password?token=abc"));
        assertThat(html).contains("pilot@example.com");
        assertThat(html).contains("https://app.example.com/reset-password?token=abc");
        assertThat(html).doesNotContain("{{email}}");
    }

    @Test
    void inviteTemplateExistsOnClasspath() throws Exception {
        ClassPathResource resource = new ClassPathResource("mail/organization-invite.html");
        assertThat(resource.exists()).isTrue();
        String body = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        assertThat(body).contains("{{actionUrl}}");
    }
}
