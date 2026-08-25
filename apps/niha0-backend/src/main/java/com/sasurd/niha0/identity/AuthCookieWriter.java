package com.sasurd.niha0.identity;

import com.sasurd.niha0.identity.dto.TokenResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.Duration;

@Component
public class AuthCookieWriter {

    public static final String REFRESH_COOKIE = "niha0_refresh";
    public static final String REFRESH_COOKIE_PATH = "/api/auth";
    public static final String ACCESS_COOKIE = "niha0_access";
    public static final String ACCESS_COOKIE_PATH = "/api";

    private final Environment environment;
    private final String cookieDomain;
    private final String cookieSameSite;
    private final boolean accessCookieEnabled;
    private final long accessTokenTtlMs;

    public AuthCookieWriter(
            Environment environment,
            @Value("${niha0.security.cookie-domain:}") String cookieDomain,
            @Value("${niha0.security.cookie-same-site:Lax}") String cookieSameSite,
            @Value("${niha0.security.access-cookie-enabled:false}") boolean accessCookieEnabled,
            @Value("${niha0.jwt.access-token-expiration-ms:3600000}") long accessTokenTtlMs) {
        this.environment = environment;
        this.cookieDomain = cookieDomain == null ? "" : cookieDomain.trim();
        this.cookieSameSite = StringUtils.hasText(cookieSameSite) ? cookieSameSite.trim() : "Lax";
        this.accessCookieEnabled = accessCookieEnabled;
        this.accessTokenTtlMs = accessTokenTtlMs;
    }

    public boolean isAccessCookieEnabled() {
        return accessCookieEnabled;
    }

    public void setSessionCookiesIfPresent(HttpServletResponse response, TokenResponse tokens) {
        setRefreshCookieIfPresent(response, tokens);
        if (accessCookieEnabled && tokens.accessToken() != null && !tokens.accessToken().isBlank()) {
            response.addHeader(HttpHeaders.SET_COOKIE,
                    buildCookie(ACCESS_COOKIE, tokens.accessToken(), ACCESS_COOKIE_PATH,
                            Duration.ofMillis(Math.max(60_000, accessTokenTtlMs))).toString());
        }
    }

    public void setRefreshCookieIfPresent(HttpServletResponse response, TokenResponse tokens) {
        if (tokens.refreshToken() == null || tokens.refreshToken().isBlank()) {
            return;
        }
        response.addHeader(HttpHeaders.SET_COOKIE,
                buildCookie(REFRESH_COOKIE, tokens.refreshToken(), REFRESH_COOKIE_PATH, Duration.ofDays(7)).toString());
    }

    public void clearSessionCookies(HttpServletResponse response) {
        clearRefreshCookie(response);
        if (accessCookieEnabled) {
            response.addHeader(HttpHeaders.SET_COOKIE,
                    buildCookie(ACCESS_COOKIE, "", ACCESS_COOKIE_PATH, Duration.ZERO).toString());
        }
    }

    public void clearRefreshCookie(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE,
                buildCookie(REFRESH_COOKIE, "", REFRESH_COOKIE_PATH, Duration.ZERO).toString());
    }

    private ResponseCookie buildCookie(String name, String value, String path, Duration maxAge) {
        boolean secure = environment.matchesProfiles("prod") || "None".equalsIgnoreCase(cookieSameSite);
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, value)
                .httpOnly(true)
                .path(path)
                .maxAge(maxAge)
                .sameSite(cookieSameSite)
                .secure(secure);
        if (StringUtils.hasText(cookieDomain)) {
            builder.domain(cookieDomain);
        }
        return builder.build();
    }
}
