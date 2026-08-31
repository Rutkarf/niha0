package com.sasurd.niha0.identity;

import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Locale;
import java.util.Map;

public final class OAuth2UserProfileResolver {

    public record OAuthUserProfile(String provider, String subject, String email, String firstName, String lastName) {
    }

    private OAuth2UserProfileResolver() {
    }

    public static OAuthUserProfile resolve(String provider, Object principal) {
        if (principal instanceof OidcUser oidcUser) {
            return fromOidc(provider, oidcUser);
        }
        if (principal instanceof OAuth2User oauth2User) {
            return fromOAuth2(provider, oauth2User);
        }
        throw new IllegalArgumentException("Unsupported OAuth principal: " + principal.getClass().getName());
    }

    private static OAuthUserProfile fromOidc(String provider, OidcUser user) {
        Map<String, Object> claims = user.getClaims();
        String firstName = stringClaim(claims, "given_name", "givenName");
        String lastName = stringClaim(claims, "family_name", "familyName");
        if (firstName.isBlank() && lastName.isBlank()) {
            firstName = stringClaim(claims, "name", "name");
        }
        return new OAuthUserProfile(
                provider,
                user.getSubject(),
                normalizeEmail(user.getEmail()),
                firstName,
                lastName);
    }

    private static OAuthUserProfile fromOAuth2(String provider, OAuth2User user) {
        Map<String, Object> attributes = user.getAttributes();
        String subject = stringClaim(attributes, subjectKeys(provider));
        if (subject.isBlank()) {
            subject = user.getName();
        }
        String email = normalizeEmail(stringClaim(attributes, "email", "emailAddress", "mail"));
        String firstName = stringClaim(attributes, "given_name", "first_name", "givenName");
        String lastName = stringClaim(attributes, "family_name", "last_name", "familyName");
        if (firstName.isBlank() && lastName.isBlank()) {
            String fullName = stringClaim(attributes, "name", "username", "login");
            String[] parts = fullName.isBlank() ? new String[0] : fullName.trim().split("\\s+", 2);
            firstName = parts.length > 0 ? parts[0] : provider.substring(0, 1).toUpperCase(Locale.ROOT) + "User";
            lastName = parts.length > 1 ? parts[1] : "OAuth";
        }
        return new OAuthUserProfile(provider, subject, email, firstName, lastName);
    }

    private static String[] subjectKeys(String provider) {
        return switch (provider) {
            case "amazon" -> new String[] {"user_id", "id"};
            default -> new String[] {"sub", "id"};
        };
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
            if (value instanceof Number number) {
                return number.toString();
            }
        }
        return "";
    }
}
