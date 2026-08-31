package com.sasurd.niha0.config;

import org.springframework.core.env.Environment;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

/** Builds Spring OAuth2 client registrations from environment variables. */
public final class OAuth2ClientRegistrations {

    public static final List<String> PROVIDER_IDS = List.of(
            "google", "microsoft", "github", "linkedin", "facebook", "discord", "apple", "amazon");

    private OAuth2ClientRegistrations() {
    }

    public static List<ClientRegistration> buildAll(Environment environment, String contextPath) {
        String redirectUri = "{baseUrl}" + contextPath + "/login/oauth2/code/{registrationId}";
        List<ClientRegistration> registrations = new ArrayList<>();
        addGoogle(environment, redirectUri, registrations);
        addMicrosoft(environment, redirectUri, registrations);
        addGitHub(environment, redirectUri, registrations);
        addLinkedIn(environment, redirectUri, registrations);
        addFacebook(environment, redirectUri, registrations);
        addDiscord(environment, redirectUri, registrations);
        addApple(environment, redirectUri, registrations);
        addAmazon(environment, redirectUri, registrations);
        return registrations;
    }

    public static List<String> configuredProviders(Environment environment) {
        return PROVIDER_IDS.stream()
                .filter(id -> hasCredentials(environment, id))
                .toList();
    }

    public static boolean hasCredentials(Environment environment, String providerId) {
        return switch (providerId) {
            case "google" -> hasPair(environment, "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET");
            case "microsoft" -> hasPair(environment, "MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET");
            case "github" -> hasPair(environment, "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET");
            case "linkedin" -> hasPair(environment, "LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET");
            case "facebook" -> hasPair(environment, "FACEBOOK_CLIENT_ID", "FACEBOOK_CLIENT_SECRET");
            case "discord" -> hasPair(environment, "DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET");
            case "apple" -> hasPair(environment, "APPLE_CLIENT_ID", "APPLE_CLIENT_SECRET");
            case "amazon" -> hasPair(environment, "AMAZON_CLIENT_ID", "AMAZON_CLIENT_SECRET");
            default -> false;
        };
    }

    private static void addGoogle(Environment env, String redirectUri, List<ClientRegistration> out) {
        if (!hasCredentials(env, "google")) {
            return;
        }
        out.add(ClientRegistration.withRegistrationId("google")
                .clientId(env.getProperty("GOOGLE_CLIENT_ID"))
                .clientSecret(env.getProperty("GOOGLE_CLIENT_SECRET"))
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(redirectUri)
                .scope(OidcScopes.OPENID, OidcScopes.PROFILE, OidcScopes.EMAIL)
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://oauth2.googleapis.com/token")
                .userInfoUri("https://openidconnect.googleapis.com/v1/userinfo")
                .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
                .userNameAttributeName("sub")
                .clientName("Google")
                .build());
    }

    private static void addMicrosoft(Environment env, String redirectUri, List<ClientRegistration> out) {
        if (!hasCredentials(env, "microsoft")) {
            return;
        }
        out.add(ClientRegistration.withRegistrationId("microsoft")
                .clientId(env.getProperty("MICROSOFT_CLIENT_ID"))
                .clientSecret(env.getProperty("MICROSOFT_CLIENT_SECRET"))
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(redirectUri)
                .scope(OidcScopes.OPENID, OidcScopes.PROFILE, OidcScopes.EMAIL, "offline_access")
                .authorizationUri("https://login.microsoftonline.com/common/oauth2/v2.0/authorize")
                .tokenUri("https://login.microsoftonline.com/common/oauth2/v2.0/token")
                .userInfoUri("https://graph.microsoft.com/oidc/userinfo")
                .jwkSetUri("https://login.microsoftonline.com/common/discovery/v2.0/keys")
                .userNameAttributeName("sub")
                .clientName("Microsoft")
                .build());
    }

    private static void addGitHub(Environment env, String redirectUri, List<ClientRegistration> out) {
        if (!hasCredentials(env, "github")) {
            return;
        }
        out.add(ClientRegistration.withRegistrationId("github")
                .clientId(env.getProperty("GITHUB_CLIENT_ID"))
                .clientSecret(env.getProperty("GITHUB_CLIENT_SECRET"))
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(redirectUri)
                .scope("read:user", "user:email")
                .authorizationUri("https://github.com/login/oauth/authorize")
                .tokenUri("https://github.com/login/oauth/access_token")
                .userInfoUri("https://api.github.com/user")
                .userNameAttributeName("id")
                .clientName("GitHub")
                .build());
    }

    private static void addLinkedIn(Environment env, String redirectUri, List<ClientRegistration> out) {
        if (!hasCredentials(env, "linkedin")) {
            return;
        }
        out.add(ClientRegistration.withRegistrationId("linkedin")
                .clientId(env.getProperty("LINKEDIN_CLIENT_ID"))
                .clientSecret(env.getProperty("LINKEDIN_CLIENT_SECRET"))
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(redirectUri)
                .scope(OidcScopes.OPENID, OidcScopes.PROFILE, OidcScopes.EMAIL)
                .authorizationUri("https://www.linkedin.com/oauth/v2/authorization")
                .tokenUri("https://www.linkedin.com/oauth/v2/accessToken")
                .userInfoUri("https://api.linkedin.com/v2/userinfo")
                .userNameAttributeName("sub")
                .clientName("LinkedIn")
                .build());
    }

    private static void addFacebook(Environment env, String redirectUri, List<ClientRegistration> out) {
        if (!hasCredentials(env, "facebook")) {
            return;
        }
        out.add(ClientRegistration.withRegistrationId("facebook")
                .clientId(env.getProperty("FACEBOOK_CLIENT_ID"))
                .clientSecret(env.getProperty("FACEBOOK_CLIENT_SECRET"))
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(redirectUri)
                .scope("email", "public_profile")
                .authorizationUri("https://www.facebook.com/v18.0/dialog/oauth")
                .tokenUri("https://graph.facebook.com/v18.0/oauth/access_token")
                .userInfoUri("https://graph.facebook.com/me?fields=id,name,email,first_name,last_name")
                .userNameAttributeName("id")
                .clientName("Facebook")
                .build());
    }

    private static void addDiscord(Environment env, String redirectUri, List<ClientRegistration> out) {
        if (!hasCredentials(env, "discord")) {
            return;
        }
        out.add(ClientRegistration.withRegistrationId("discord")
                .clientId(env.getProperty("DISCORD_CLIENT_ID"))
                .clientSecret(env.getProperty("DISCORD_CLIENT_SECRET"))
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(redirectUri)
                .scope("identify", "email")
                .authorizationUri("https://discord.com/api/oauth2/authorize")
                .tokenUri("https://discord.com/api/oauth2/token")
                .userInfoUri("https://discord.com/api/users/@me")
                .userNameAttributeName("id")
                .clientName("Discord")
                .build());
    }

    private static void addApple(Environment env, String redirectUri, List<ClientRegistration> out) {
        if (!hasCredentials(env, "apple")) {
            return;
        }
        out.add(ClientRegistration.withRegistrationId("apple")
                .clientId(env.getProperty("APPLE_CLIENT_ID"))
                .clientSecret(env.getProperty("APPLE_CLIENT_SECRET"))
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(redirectUri)
                .scope(OidcScopes.OPENID, OidcScopes.EMAIL, "name")
                .authorizationUri("https://appleid.apple.com/auth/authorize")
                .tokenUri("https://appleid.apple.com/auth/token")
                .jwkSetUri("https://appleid.apple.com/auth/keys")
                .userNameAttributeName("sub")
                .clientName("Apple")
                .build());
    }

    private static void addAmazon(Environment env, String redirectUri, List<ClientRegistration> out) {
        if (!hasCredentials(env, "amazon")) {
            return;
        }
        out.add(ClientRegistration.withRegistrationId("amazon")
                .clientId(env.getProperty("AMAZON_CLIENT_ID"))
                .clientSecret(env.getProperty("AMAZON_CLIENT_SECRET"))
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(redirectUri)
                .scope("profile")
                .authorizationUri("https://www.amazon.com/ap/oa")
                .tokenUri("https://api.amazon.com/auth/o2/token")
                .userInfoUri("https://api.amazon.com/user/profile")
                .userNameAttributeName("user_id")
                .clientName("Amazon")
                .build());
    }

    private static boolean hasPair(Environment environment, String idKey, String secretKey) {
        return StringUtils.hasText(environment.getProperty(idKey))
                && StringUtils.hasText(environment.getProperty(secretKey));
    }
}
