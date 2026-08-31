package com.sasurd.niha0.identity;

import com.sasurd.niha0.identity.dto.TokenResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

@Component
@ConditionalOnBean(ClientRegistrationRepository.class)
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final SsoCodeService ssoCodeService;
    private final String publicUrl;

    public OAuth2LoginSuccessHandler(AuthService authService,
                                     SsoCodeService ssoCodeService,
                                     @Value("${niha0.app.public-url}") String publicUrl) {
        this.authService = authService;
        this.ssoCodeService = ssoCodeService;
        this.publicUrl = publicUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        if (!(authentication instanceof OAuth2AuthenticationToken oauthToken)) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Unsupported OAuth authentication");
            return;
        }

        OAuth2UserProfileResolver.OAuthUserProfile profile;
        try {
            profile = OAuth2UserProfileResolver.resolve(
                    oauthToken.getAuthorizedClientRegistrationId(),
                    oauthToken.getPrincipal());
        } catch (IllegalArgumentException ex) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, ex.getMessage());
            return;
        }

        if (profile.email() == null || profile.email().isBlank()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Email not provided by identity provider");
            return;
        }

        TokenResponse tokens = authService.authenticateOAuthUser(
                profile.provider(),
                profile.subject(),
                profile.email(),
                profile.firstName(),
                profile.lastName());

        UUID code = ssoCodeService.createCode(tokens);
        String redirect = publicUrl.replaceAll("/$", "") + "/auth/sso-callback?code=" + code;
        response.sendRedirect(redirect);
    }
}
