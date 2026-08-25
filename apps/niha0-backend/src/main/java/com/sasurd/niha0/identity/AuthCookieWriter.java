package com.sasurd.niha0.identity;

import com.sasurd.niha0.identity.dto.TokenResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class AuthCookieWriter {

    public static final String REFRESH_COOKIE = "niha0_refresh";
    public static final String REFRESH_COOKIE_PATH = "/api/auth";

    private final Environment environment;

    public AuthCookieWriter(Environment environment) {
        this.environment = environment;
    }

    public void setRefreshCookieIfPresent(HttpServletResponse response, TokenResponse tokens) {
        if (tokens.refreshToken() == null || tokens.refreshToken().isBlank()) {
            return;
        }
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, tokens.refreshToken())
                .httpOnly(true)
                .path(REFRESH_COOKIE_PATH)
                .maxAge(Duration.ofDays(7))
                .sameSite("Lax")
                .secure(environment.matchesProfiles("prod"))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, "")
                .httpOnly(true)
                .path(REFRESH_COOKIE_PATH)
                .maxAge(0)
                .sameSite("Lax")
                .secure(environment.matchesProfiles("prod"))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
