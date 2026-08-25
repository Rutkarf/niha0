package com.sasurd.niha0.config;

import com.sasurd.niha0.identity.OAuth2LoginSuccessHandler;
import com.sasurd.niha0.identity.OAuth2StatusService;
import com.sasurd.niha0.security.AuthRateLimitFilter;
import com.sasurd.niha0.security.JwtAuthFilter;
import com.sasurd.niha0.security.OsApiRateLimitFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.util.matcher.RequestMatcher;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final AuthRateLimitFilter authRateLimitFilter;
    private final OsApiRateLimitFilter osApiRateLimitFilter;
    private final Environment environment;
    private final OAuth2StatusService oauth2StatusService;
    private final ObjectProvider<OAuth2LoginSuccessHandler> oauth2LoginSuccessHandler;
    private final boolean csrfEnabled;
    private final boolean accessCookieEnabled;

    public SecurityConfig(
            JwtAuthFilter jwtAuthFilter,
            AuthRateLimitFilter authRateLimitFilter,
            OsApiRateLimitFilter osApiRateLimitFilter,
            Environment environment,
            OAuth2StatusService oauth2StatusService,
            ObjectProvider<OAuth2LoginSuccessHandler> oauth2LoginSuccessHandler,
            @Value("${niha0.security.csrf-enabled:false}") boolean csrfEnabled,
            @Value("${niha0.security.access-cookie-enabled:false}") boolean accessCookieEnabled) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.authRateLimitFilter = authRateLimitFilter;
        this.osApiRateLimitFilter = osApiRateLimitFilter;
        this.environment = environment;
        this.oauth2StatusService = oauth2StatusService;
        this.oauth2LoginSuccessHandler = oauth2LoginSuccessHandler;
        this.csrfEnabled = csrfEnabled;
        this.accessCookieEnabled = accessCookieEnabled;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        boolean oauth2LoginActive = oauth2StatusService.isOAuth2LoginActive();
        SessionCreationPolicy sessionPolicy = oauth2LoginActive
                ? SessionCreationPolicy.IF_REQUIRED
                : SessionCreationPolicy.STATELESS;

        http
                .sessionManagement(s -> s.sessionCreationPolicy(sessionPolicy))
                .headers(headers -> headers
                        .contentTypeOptions(Customizer.withDefaults())
                        .frameOptions(frame -> frame.deny())
                        .httpStrictTransportSecurity(hsts -> {
                            if (environment.matchesProfiles("prod")) {
                                hsts.includeSubDomains(true).preload(true).maxAgeInSeconds(31_536_000);
                            } else {
                                hsts.disable();
                            }
                        }))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) ->
                                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized"))
                        .accessDeniedHandler((request, response, accessDeniedException) ->
                                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden")))
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers("/auth/login", "/auth/register", "/auth/refresh",
                                    "/auth/forgot-password", "/auth/reset-password", "/auth/accept-invite",
                                    "/auth/mfa/verify", "/auth/oauth2/status", "/auth/sso/exchange",
                                    "/auth/oauth2/**", "/oauth2/**", "/login/oauth2/**")
                            .permitAll()
                            .requestMatchers("/billing/webhooks/sumup").permitAll()
                            .requestMatchers("/actuator/health").permitAll()
                            .requestMatchers("/actuator/prometheus").authenticated()
                            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
                    if (!environment.matchesProfiles("prod")) {
                        auth.requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll();
                    }
                    auth.anyRequest().authenticated();
                })
                .addFilterBefore(authRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(osApiRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        if (oauth2LoginActive) {
            OAuth2LoginSuccessHandler handler = oauth2LoginSuccessHandler.getIfAvailable();
            if (handler != null) {
                http.oauth2Login(oauth2 -> oauth2.successHandler(handler));
            }
        }

        if (csrfEnabled) {
            CookieCsrfTokenRepository repo = CookieCsrfTokenRepository.withHttpOnlyFalse();
            repo.setCookiePath("/");
            CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
            requestHandler.setCsrfRequestAttributeName(null);
            http.csrf(csrf -> csrf
                    .csrfTokenRepository(repo)
                    .csrfTokenRequestHandler(requestHandler)
                    .ignoringRequestMatchers(csrfIgnoreMatcher()));
        } else {
            http.csrf(AbstractHttpConfigurer::disable);
        }

        return http.build();
    }

    /**
     * When CSRF is enabled, still ignore webhooks and pure Bearer API calls
     * (Authorization header present) so current SPA Bearer mode keeps working.
     * Cookie-only mutations without Bearer require the X-XSRF-TOKEN header.
     */
    private RequestMatcher csrfIgnoreMatcher() {
        return (HttpServletRequest request) -> {
            String path = request.getRequestURI() == null ? "" : request.getRequestURI();
            if (path.contains("/billing/webhooks/")
                    || path.contains("/auth/login")
                    || path.contains("/auth/register")
                    || path.contains("/auth/refresh")
                    || path.contains("/auth/forgot-password")
                    || path.contains("/auth/reset-password")
                    || path.contains("/auth/accept-invite")
                    || path.contains("/auth/mfa/verify")
                    || path.contains("/auth/oauth2/status")
                    || path.contains("/auth/sso/exchange")
                    || path.contains("/oauth2/")
                    || path.contains("/login/oauth2/")) {
                return true;
            }
            String authz = request.getHeader("Authorization");
            // When access cookie mode is on, CSRF applies even if a legacy Bearer is present.
            if (accessCookieEnabled) {
                return false;
            }
            return authz != null && authz.regionMatches(true, 0, "Bearer ", 0, 7);
        };
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
