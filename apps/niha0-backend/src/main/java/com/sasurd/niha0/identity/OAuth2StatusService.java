package com.sasurd.niha0.identity;

import com.sasurd.niha0.identity.dto.OAuth2StatusResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class OAuth2StatusService {

    private final boolean oauth2Enabled;
    private final Environment environment;

    public OAuth2StatusService(@Value("${niha0.oauth2.enabled:false}") boolean oauth2Enabled,
                               Environment environment) {
        this.oauth2Enabled = oauth2Enabled;
        this.environment = environment;
    }

    public OAuth2StatusResponse status() {
        if (!oauth2Enabled || !hasGoogleClientId()) {
            return new OAuth2StatusResponse(false, List.of());
        }
        return new OAuth2StatusResponse(true, List.of("google"));
    }

    public boolean isOAuth2LoginActive() {
        return oauth2Enabled && hasGoogleClientId();
    }

    private boolean hasGoogleClientId() {
        return StringUtils.hasText(environment.getProperty("GOOGLE_CLIENT_ID"));
    }
}
