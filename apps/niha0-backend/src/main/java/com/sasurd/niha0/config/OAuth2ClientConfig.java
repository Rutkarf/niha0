package com.sasurd.niha0.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;

import java.util.List;

@Configuration
@ConditionalOnProperty(name = "niha0.oauth2.enabled", havingValue = "true")
public class OAuth2ClientConfig {

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository(
            Environment environment,
            @Value("${server.servlet.context-path:/api}") String contextPath) {
        List<org.springframework.security.oauth2.client.registration.ClientRegistration> registrations =
                OAuth2ClientRegistrations.buildAll(environment, contextPath);
        if (registrations.isEmpty()) {
            throw new IllegalStateException(
                    "niha0.oauth2.enabled=true but no OAuth client credentials are configured "
                            + "(set CLIENT_ID and CLIENT_SECRET pairs for at least one provider)");
        }
        return new InMemoryClientRegistrationRepository(registrations);
    }
}
