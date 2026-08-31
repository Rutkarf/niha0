package com.sasurd.niha0.identity;

import com.sasurd.niha0.config.OAuth2ClientRegistrations;
import com.sasurd.niha0.identity.dto.OAuth2StatusResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class OAuth2StatusService {

    private final boolean oauth2Enabled;
    private final boolean demoMode;
    private final Environment environment;

    public OAuth2StatusService(@Value("${niha0.oauth2.enabled:false}") boolean oauth2Enabled,
                               @Value("${niha0.oauth2.demo-mode:false}") boolean demoMode,
                               Environment environment) {
        this.oauth2Enabled = oauth2Enabled;
        this.demoMode = demoMode;
        this.environment = environment;
    }

    public OAuth2StatusResponse status() {
        if (demoMode) {
            return new OAuth2StatusResponse(true, OAuth2ClientRegistrations.PROVIDER_IDS, true);
        }
        List<String> providers = configuredProviders();
        if (!oauth2Enabled || providers.isEmpty()) {
            return new OAuth2StatusResponse(false, List.of(), false);
        }
        return new OAuth2StatusResponse(true, providers, false);
    }

    public boolean isOAuth2LoginActive() {
        return oauth2Enabled && !configuredProviders().isEmpty();
    }

    public boolean isDemoMode() {
        return demoMode;
    }

    public List<String> configuredProviders() {
        return OAuth2ClientRegistrations.configuredProviders(environment);
    }

    public List<String> availableProviders() {
        if (demoMode) {
            return OAuth2ClientRegistrations.PROVIDER_IDS;
        }
        Set<String> merged = new LinkedHashSet<>(configuredProviders());
        return new ArrayList<>(merged);
    }
}
