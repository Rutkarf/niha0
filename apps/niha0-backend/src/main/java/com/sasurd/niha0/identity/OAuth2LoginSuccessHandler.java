package com.sasurd.niha0.identity;

import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.identity.dto.TokenResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Component
@ConditionalOnExpression("${niha0.oauth2.enabled:false} && !'${GOOGLE_CLIENT_ID:}'.isEmpty()")
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private static final String GOOGLE_PROVIDER = "google";

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
        if (!(authentication.getPrincipal() instanceof OidcUser oidcUser)) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Unsupported OAuth principal");
            return;
        }

        String email = normalizeEmail(oidcUser.getEmail());
        if (email == null || email.isBlank()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Email not provided by identity provider");
            return;
        }

        Map<String, Object> claims = oidcUser.getClaims();
        String firstName = stringClaim(claims, "given_name", "givenName");
        String lastName = stringClaim(claims, "family_name", "familyName");
        if (firstName.isBlank() && lastName.isBlank()) {
            String fullName = stringClaim(claims, "name", "name");
            firstName = fullName;
        }

        TokenResponse tokens = authService.authenticateOAuthUser(
                GOOGLE_PROVIDER,
                oidcUser.getSubject(),
                email,
                firstName,
                lastName);

        UUID code = ssoCodeService.createCode(tokens);
        String redirect = publicUrl.replaceAll("/$", "") + "/auth/sso-callback?code=" + code;
        response.sendRedirect(redirect);
    }

    private static String normalizeEmail(String email) {
        if (email == null) {
            return "";
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String stringClaim(Map<String, Object> claims, String... keys) {
        for (String key : keys) {
            Object value = claims.get(key);
            if (value instanceof String s && !s.isBlank()) {
                return s.trim();
            }
        }
        return "";
    }
}
