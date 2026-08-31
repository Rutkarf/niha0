package com.sasurd.niha0.identity;

import com.sasurd.niha0.config.OAuth2ClientRegistrations;
import com.sasurd.niha0.identity.dto.TokenResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.Locale;
import java.util.UUID;

/**
 * Simulated OAuth login for local/demo — all 8 providers without third-party app registration.
 */
@RestController
@RequestMapping("/auth/oauth2/demo")
@ConditionalOnProperty(name = "niha0.oauth2.demo-mode", havingValue = "true")
public class OAuth2DemoController {

    private final AuthService authService;
    private final SsoCodeService ssoCodeService;
    private final String publicUrl;

    public OAuth2DemoController(AuthService authService,
                                SsoCodeService ssoCodeService,
                                @Value("${niha0.app.public-url}") String publicUrl) {
        this.authService = authService;
        this.ssoCodeService = ssoCodeService;
        this.publicUrl = publicUrl;
    }

    @GetMapping("/{provider}")
    public void startDemoLogin(@PathVariable String provider, HttpServletResponse response) throws IOException {
        if (!OAuth2ClientRegistrations.PROVIDER_IDS.contains(provider)) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Unknown OAuth provider: " + provider);
            return;
        }

        String normalized = provider.toLowerCase(Locale.ROOT);
        String email = "oauth-demo-" + normalized + "@nihao.local";
        String subject = "demo-" + normalized + "-" + UUID.randomUUID();
        String label = providerLabel(normalized);

        TokenResponse tokens = authService.authenticateOAuthUser(
                normalized,
                subject,
                email,
                label,
                "Demo");

        UUID code = ssoCodeService.createCode(tokens);
        String redirect = publicUrl.replaceAll("/$", "") + "/auth/sso-callback?code=" + code;
        response.sendRedirect(redirect);
    }

    private static String providerLabel(String provider) {
        return switch (provider) {
            case "google" -> "Google";
            case "microsoft" -> "Microsoft";
            case "github" -> "GitHub";
            case "linkedin" -> "LinkedIn";
            case "facebook" -> "Facebook";
            case "discord" -> "Discord";
            case "apple" -> "Apple";
            case "amazon" -> "Amazon";
            default -> "OAuth";
        };
    }
}
