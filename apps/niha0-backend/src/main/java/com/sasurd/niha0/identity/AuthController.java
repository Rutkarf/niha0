package com.sasurd.niha0.identity;

import com.sasurd.niha0.identity.dto.AcceptInviteRequest;
import com.sasurd.niha0.identity.dto.ForgotPasswordRequest;
import com.sasurd.niha0.identity.dto.LocaleUpdateRequest;
import com.sasurd.niha0.identity.dto.LoginRequest;
import com.sasurd.niha0.identity.dto.MessageResponse;
import com.sasurd.niha0.identity.dto.MfaConfirmRequest;
import com.sasurd.niha0.identity.dto.MfaDisableRequest;
import com.sasurd.niha0.identity.dto.MfaEnableResponse;
import com.sasurd.niha0.identity.dto.MfaVerifyRequest;
import com.sasurd.niha0.identity.dto.OAuth2StatusResponse;
import com.sasurd.niha0.identity.dto.RefreshRequest;
import com.sasurd.niha0.identity.dto.RegisterRequest;
import com.sasurd.niha0.identity.dto.ResetPasswordRequest;
import com.sasurd.niha0.identity.dto.SsoExchangeRequest;
import com.sasurd.niha0.identity.dto.TokenResponse;
import com.sasurd.niha0.identity.dto.UserMeResponse;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final OAuth2StatusService oauth2StatusService;
    private final SsoCodeService ssoCodeService;
    private final AuthCookieWriter authCookieWriter;

    public AuthController(AuthService authService,
                          OAuth2StatusService oauth2StatusService,
                          SsoCodeService ssoCodeService,
                          AuthCookieWriter authCookieWriter) {
        this.authService = authService;
        this.oauth2StatusService = oauth2StatusService;
        this.ssoCodeService = ssoCodeService;
        this.authCookieWriter = authCookieWriter;
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        TokenResponse tokens = authService.login(request);
        authCookieWriter.setSessionCookiesIfPresent(response, tokens);
        return tokens;
    }

    @PostMapping("/register")
    public TokenResponse register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        TokenResponse tokens = authService.register(request);
        authCookieWriter.setSessionCookiesIfPresent(response, tokens);
        return tokens;
    }

    @PostMapping("/refresh")
    public TokenResponse refresh(@RequestBody(required = false) RefreshRequest request,
                                 @CookieValue(name = AuthCookieWriter.REFRESH_COOKIE, required = false) String cookieRefresh,
                                 HttpServletResponse response) {
        TokenResponse tokens = authService.refresh(request, cookieRefresh);
        authCookieWriter.setSessionCookiesIfPresent(response, tokens);
        return tokens;
    }

    @PostMapping("/logout")
    public MessageResponse logout(HttpServletResponse response) {
        authService.logout();
        authCookieWriter.clearSessionCookies(response);
        return new MessageResponse("Logged out.");
    }

    @PostMapping("/mfa/verify")
    public TokenResponse verifyMfa(@Valid @RequestBody MfaVerifyRequest request, HttpServletResponse response) {
        TokenResponse tokens = authService.verifyMfa(request);
        authCookieWriter.setSessionCookiesIfPresent(response, tokens);
        return tokens;
    }

    @GetMapping("/me")
    public UserMeResponse me() {
        return authService.me();
    }

    @GetMapping("/oauth2/status")
    public OAuth2StatusResponse oauth2Status() {
        return oauth2StatusService.status();
    }

    @PostMapping("/sso/exchange")
    public TokenResponse exchangeSso(@Valid @RequestBody SsoExchangeRequest request,
                                     HttpServletResponse response) {
        TokenResponse tokens = ssoCodeService.exchangeCode(request.code());
        authCookieWriter.setSessionCookiesIfPresent(response, tokens);
        return tokens;
    }

    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return authService.forgotPassword(request);
    }

    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return authService.resetPassword(request);
    }

    @PostMapping("/accept-invite")
    public TokenResponse acceptInvite(@Valid @RequestBody AcceptInviteRequest request,
                                      HttpServletResponse response) {
        TokenResponse tokens = authService.acceptInvite(request);
        authCookieWriter.setSessionCookiesIfPresent(response, tokens);
        return tokens;
    }

    @PostMapping("/mfa/enable")
    public MfaEnableResponse enableMfa() {
        return authService.enableMfa();
    }

    @PostMapping("/mfa/confirm")
    public MessageResponse confirmMfa(@Valid @RequestBody MfaConfirmRequest request) {
        return authService.confirmMfa(request);
    }

    @PostMapping("/mfa/disable")
    public MessageResponse disableMfa(@Valid @RequestBody MfaDisableRequest request) {
        return authService.disableMfa(request);
    }

    @PatchMapping("/me/locale")
    public MessageResponse updateLocale(@Valid @RequestBody LocaleUpdateRequest request) {
        return authService.updateLocale(request);
    }
}
