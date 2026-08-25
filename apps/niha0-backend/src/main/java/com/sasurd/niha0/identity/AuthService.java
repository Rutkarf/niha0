package com.sasurd.niha0.identity;

import com.sasurd.niha0.audit.AuditService;
import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.common.Role;
import com.sasurd.niha0.identity.dto.AcceptInviteRequest;
import com.sasurd.niha0.identity.dto.ForgotPasswordRequest;
import com.sasurd.niha0.identity.dto.LocaleUpdateRequest;
import com.sasurd.niha0.identity.dto.LoginRequest;
import com.sasurd.niha0.identity.dto.MessageResponse;
import com.sasurd.niha0.identity.dto.MfaConfirmRequest;
import com.sasurd.niha0.identity.dto.MfaDisableRequest;
import com.sasurd.niha0.identity.dto.MfaEnableResponse;
import com.sasurd.niha0.identity.dto.MfaVerifyRequest;
import com.sasurd.niha0.identity.dto.RefreshRequest;
import com.sasurd.niha0.identity.dto.RegisterRequest;
import com.sasurd.niha0.identity.dto.ResetPasswordRequest;
import com.sasurd.niha0.identity.dto.TokenResponse;
import com.sasurd.niha0.identity.dto.UserMeResponse;
import com.sasurd.niha0.organization.Membership;
import com.sasurd.niha0.organization.MembershipRepository;
import com.sasurd.niha0.organization.Organization;
import com.sasurd.niha0.organization.OrganizationInvite;
import com.sasurd.niha0.organization.OrganizationInviteRepository;
import com.sasurd.niha0.organization.OrganizationRepository;
import com.sasurd.niha0.security.JwtService;
import com.sasurd.niha0.security.SecurityUtils;
import com.sasurd.niha0.security.TotpService;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.text.Normalizer;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /** Known Flyway seed emails — blocked when demo-login-enabled=false (prod). */
    private static final Set<String> DEMO_EMAILS = Set.of(
            "rutkarf@optimustest.fr",
            "sales@optimustest.fr",
            "support@optimustest.fr",
            "ceo@tenant-isolation.fr",
            "ceo@nova-atelier.fr",
            "sales@nova-atelier.fr",
            "support@nova-atelier.fr",
            "ceo@rival-studio.fr"
    );

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final OrganizationInviteRepository organizationInviteRepository;
    private final MembershipRepository membershipRepository;
    private final OrganizationRepository organizationRepository;
    private final OAuthIdentityRepository oauthIdentityRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final MailService mailService;
    private final TotpService totpService;
    private final AuditService auditService;
    private final boolean demoLoginEnabled;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       OrganizationInviteRepository organizationInviteRepository,
                       MembershipRepository membershipRepository,
                       OrganizationRepository organizationRepository,
                       OAuthIdentityRepository oauthIdentityRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       MailService mailService,
                       TotpService totpService,
                       AuditService auditService,
                       @Value("${niha0.security.demo-login-enabled:true}") boolean demoLoginEnabled) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.organizationInviteRepository = organizationInviteRepository;
        this.membershipRepository = membershipRepository;
        this.organizationRepository = organizationRepository;
        this.oauthIdentityRepository = oauthIdentityRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.mailService = mailService;
        this.totpService = totpService;
        this.auditService = auditService;
        this.demoLoginEnabled = demoLoginEnabled;
    }

    @Transactional
    public TokenResponse register(RegisterRequest request) {
        if (userRepository.findByEmailIgnoreCase(request.email()).isPresent()) {
            throw new ApiException(409, "Email already registered");
        }

        String slug = uniqueSlug(request.companyName());

        Organization org = new Organization();
        org.setName(request.companyName().trim());
        org.setSlug(slug);
        org.setSector(request.sector() == null || request.sector().isBlank() ? "Services" : request.sector().trim());
        org.setProfessionalEmail(request.email().trim().toLowerCase(Locale.ROOT));
        org.setOnboardingStatus("IN_PROGRESS");
        org.setWorkspaceConfig(defaultWorkspaceConfigJson());
        organizationRepository.save(org);

        User user = new User();
        user.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setActive(true);
        userRepository.save(user);

        Membership membership = new Membership();
        membership.setOrganizationId(org.getId());
        membership.setUserId(user.getId());
        membership.setRole(Role.OWNER);
        membership.setActive(true);
        membershipRepository.save(membership);

        return buildTokenResponse(user, org, Role.OWNER);
    }

    @Transactional
    public TokenResponse login(LoginRequest request) {
        String email = request.email() == null ? "" : request.email().trim().toLowerCase(Locale.ROOT);
        if (!demoLoginEnabled && DEMO_EMAILS.contains(email)) {
            throw new ApiException(401, "Invalid credentials");
        }

        User user = userRepository.findByEmailIgnoreCase(request.email())
                .filter(User::isActive)
                .orElseThrow(() -> new ApiException(401, "Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(401, "Invalid credentials");
        }

        Membership membership = resolveMembership(user.getId(), request.organizationSlug());
        Organization org = organizationRepository.findById(membership.getOrganizationId())
                .orElseThrow(() -> new ApiException(401, "Organization not found"));

        if (user.isMfaEnabled()) {
            String mfaToken = jwtService.generateMfaToken(
                    user.getId(), org.getId(), membership.getRole(), user.getEmail());
            return TokenResponse.mfaChallenge(mfaToken, user.getId(), org.getId(), membership.getRole());
        }

        auditService.logFor(org.getId(), user.getId(), "LOGIN", "User", user.getId(), "password");
        return buildTokenResponse(user, org, membership.getRole());
    }

    @Transactional
    public TokenResponse refresh(RefreshRequest request, String cookieRefreshToken) {
        String refreshTokenValue = resolveRefreshToken(request, cookieRefreshToken);
        RefreshToken refreshToken = refreshTokenRepository.findByTokenAndRevokedFalse(refreshTokenValue)
                .filter(rt -> rt.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> new ApiException(401, "Invalid refresh token"));

        User user = userRepository.findById(refreshToken.getUserId())
                .filter(User::isActive)
                .orElseThrow(() -> new ApiException(401, "User not found"));

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        Membership membership = membershipRepository.findByUserIdAndActiveTrue(user.getId()).stream()
                .findFirst()
                .orElseThrow(() -> new ApiException(401, "No active membership"));

        Organization org = organizationRepository.findById(membership.getOrganizationId())
                .orElseThrow(() -> new ApiException(401, "Organization not found"));

        return buildTokenResponse(user, org, membership.getRole());
    }

    @Transactional
    public void logout() {
        UUID userId = SecurityUtils.currentUserId();
        if (userId == null) {
            throw new ApiException(401, "Unauthorized");
        }
        refreshTokenRepository.revokeAllActiveByUserId(userId);
    }

    @Transactional
    public TokenResponse verifyMfa(MfaVerifyRequest request) {
        Claims claims;
        try {
            claims = jwtService.parseClaims(request.mfaToken());
        } catch (Exception e) {
            throw new ApiException(401, "Invalid MFA token");
        }
        if (!jwtService.isMfaToken(claims)) {
            throw new ApiException(401, "Invalid MFA token");
        }

        UUID userId = jwtService.extractUserId(claims);
        UUID orgId = jwtService.extractOrganizationId(claims);
        Role role = jwtService.extractRole(claims);

        User user = userRepository.findById(userId)
                .filter(User::isActive)
                .filter(User::isMfaEnabled)
                .orElseThrow(() -> new ApiException(401, "Invalid MFA token"));

        if (!verifyMfaCode(user, request.code())) {
            throw new ApiException(401, "Invalid MFA code");
        }
        userRepository.save(user);

        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ApiException(401, "Organization not found"));

        return buildTokenResponse(user, org, role);
    }

    @Transactional(readOnly = true)
    public UserMeResponse me() {
        UUID userId = SecurityUtils.currentUserId();
        UUID orgId = SecurityUtils.requireOrganizationId();
        Role role = SecurityUtils.currentRole();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(404, "User not found"));
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ApiException(404, "Organization not found"));

        return new UserMeResponse(
                user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(),
                org.getId(), org.getName(), role);
    }

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        userRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
            PasswordResetToken token = new PasswordResetToken();
            token.setUserId(user.getId());
            UUID tokenValue = UUID.randomUUID();
            token.setToken(tokenValue);
            token.setExpiresAt(Instant.now().plus(1, ChronoUnit.HOURS));
            passwordResetTokenRepository.save(token);
            mailService.sendPasswordResetToken(email, tokenValue);
        });
        return new MessageResponse("If an account exists for this email, a reset link has been sent.");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        PasswordResetToken token = passwordResetTokenRepository.findByToken(request.token())
                .filter(t -> t.getUsedAt() == null)
                .filter(t -> t.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> new ApiException(400, "Invalid or expired reset token"));

        User user = userRepository.findById(token.getUserId())
                .filter(User::isActive)
                .orElseThrow(() -> new ApiException(400, "Invalid or expired reset token"));

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        token.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(token);
        refreshTokenRepository.revokeAllActiveByUserId(user.getId());

        return new MessageResponse("Password has been reset.");
    }

    @Transactional
    public TokenResponse acceptInvite(AcceptInviteRequest request) {
        OrganizationInvite invite = organizationInviteRepository.findByToken(request.token())
                .filter(i -> i.getAcceptedAt() == null)
                .filter(i -> i.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> new ApiException(400, "Invalid or expired invite"));

        String email = invite.getEmail().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            User created = new User();
            created.setEmail(email);
            created.setPasswordHash(passwordEncoder.encode(request.password()));
            created.setFirstName(request.firstName().trim());
            created.setLastName(request.lastName().trim());
            created.setActive(true);
            return userRepository.save(created);
        });

        membershipRepository.findByUserIdAndOrganizationIdAndActiveTrue(user.getId(), invite.getOrganizationId())
                .ifPresent(m -> {
                    throw new ApiException(409, "User is already a member of this organization");
                });

        Membership membership = new Membership();
        membership.setOrganizationId(invite.getOrganizationId());
        membership.setUserId(user.getId());
        membership.setRole(invite.getRole());
        membership.setActive(true);
        membershipRepository.save(membership);

        invite.setAcceptedAt(Instant.now());
        organizationInviteRepository.save(invite);

        Organization org = organizationRepository.findById(invite.getOrganizationId())
                .orElseThrow(() -> new ApiException(404, "Organization not found"));

        return buildTokenResponse(user, org, invite.getRole());
    }

    @Transactional
    public MfaEnableResponse enableMfa() {
        User user = requireCurrentUser();
        String secret = totpService.generateSecret(32);
        user.setMfaSecret(secret);
        user.setMfaEnabled(false);
        user.setMfaRecoveryCodes(null);
        userRepository.save(user);
        String otpauthUri = totpService.buildOtpAuthUri(user.getEmail(), secret);
        return new MfaEnableResponse(secret, otpauthUri, false);
    }

    @Transactional
    public MessageResponse confirmMfa(MfaConfirmRequest request) {
        User user = requireCurrentUser();
        if (user.getMfaSecret() == null || user.getMfaSecret().isBlank()) {
            throw new ApiException(400, "MFA setup not started");
        }
        if (!totpService.verify(user.getMfaSecret(), request.code())) {
            throw new ApiException(400, "Invalid MFA code");
        }
        user.setMfaEnabled(true);
        user.setMfaRecoveryCodes(generateRecoveryCodes());
        userRepository.save(user);
        return new MessageResponse("MFA enabled.");
    }

    @Transactional
    public MessageResponse disableMfa(MfaDisableRequest request) {
        User user = requireCurrentUser();
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(401, "Invalid password");
        }
        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        user.setMfaRecoveryCodes(null);
        userRepository.save(user);
        return new MessageResponse("MFA disabled.");
    }

    @Transactional
    public MessageResponse updateLocale(LocaleUpdateRequest request) {
        User user = requireCurrentUser();
        user.setLocale(request.locale().trim().toLowerCase(Locale.ROOT));
        userRepository.save(user);
        return new MessageResponse("Locale updated.");
    }

    public String extractRefreshTokenForCookie(TokenResponse response) {
        return response.refreshToken();
    }

    /**
     * Resolves or provisions a user from an OAuth/OIDC login, links {@code oauth_identities},
     * and issues JWT session tokens (MFA is not re-challenged for federated login).
     */
    @Transactional
    public TokenResponse authenticateOAuthUser(String provider,
                                               String providerSubject,
                                               String email,
                                               String firstName,
                                               String lastName) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);

        return oauthIdentityRepository.findByProviderAndProviderSubject(provider, providerSubject)
                .flatMap(identity -> userRepository.findById(identity.getUserId()))
                .filter(User::isActive)
                .map(user -> buildTokenResponseForUser(user))
                .orElseGet(() -> linkOrCreateOAuthUser(
                        provider, providerSubject, normalizedEmail, firstName, lastName));
    }

    private TokenResponse linkOrCreateOAuthUser(String provider,
                                                String providerSubject,
                                                String email,
                                                String firstName,
                                                String lastName) {
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user != null) {
            if (!user.isActive()) {
                throw new ApiException(401, "Account disabled");
            }
            linkOAuthIdentity(user.getId(), provider, providerSubject, email);
            return buildTokenResponseForUser(user);
        }

        String safeFirst = firstName == null || firstName.isBlank() ? "Utilisateur" : firstName.trim();
        String safeLast = lastName == null || lastName.isBlank() ? "OAuth" : lastName.trim();
        String companyName = safeFirst + " " + safeLast;
        String slug = uniqueSlug(companyName);

        Organization org = new Organization();
        org.setName(companyName);
        org.setSlug(slug);
        org.setSector("Services");
        org.setProfessionalEmail(email);
        org.setOnboardingStatus("IN_PROGRESS");
        org.setWorkspaceConfig(defaultWorkspaceConfigJson());
        organizationRepository.save(org);

        User created = new User();
        created.setEmail(email);
        created.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        created.setFirstName(safeFirst);
        created.setLastName(safeLast);
        created.setActive(true);
        userRepository.save(created);

        Membership membership = new Membership();
        membership.setOrganizationId(org.getId());
        membership.setUserId(created.getId());
        membership.setRole(Role.OWNER);
        membership.setActive(true);
        membershipRepository.save(membership);

        linkOAuthIdentity(created.getId(), provider, providerSubject, email);
        return buildTokenResponse(created, org, Role.OWNER);
    }

    private void linkOAuthIdentity(UUID userId, String provider, String providerSubject, String email) {
        if (oauthIdentityRepository.findByProviderAndProviderSubject(provider, providerSubject).isPresent()) {
            return;
        }
        OAuthIdentity identity = new OAuthIdentity();
        identity.setUserId(userId);
        identity.setProvider(provider);
        identity.setProviderSubject(providerSubject);
        identity.setEmail(email);
        oauthIdentityRepository.save(identity);
    }

    private TokenResponse buildTokenResponseForUser(User user) {
        Membership membership = membershipRepository.findByUserIdAndActiveTrue(user.getId()).stream()
                .findFirst()
                .orElseThrow(() -> new ApiException(401, "No active membership"));
        Organization org = organizationRepository.findById(membership.getOrganizationId())
                .orElseThrow(() -> new ApiException(401, "Organization not found"));
        return buildTokenResponse(user, org, membership.getRole());
    }

    private boolean verifyMfaCode(User user, String code) {
        if (totpService.verify(user.getMfaSecret(), code)) {
            return true;
        }
        return consumeRecoveryCode(user, code);
    }

    private boolean consumeRecoveryCode(User user, String code) {
        if (user.getMfaRecoveryCodes() == null || user.getMfaRecoveryCodes().isBlank()) {
            return false;
        }
        List<String> codes = new ArrayList<>(Arrays.asList(user.getMfaRecoveryCodes().split(",")));
        String normalized = code.trim();
        if (!codes.remove(normalized)) {
            return false;
        }
        user.setMfaRecoveryCodes(String.join(",", codes));
        return true;
    }

    private String generateRecoveryCodes() {
        return SECURE_RANDOM.ints(8, 0, 1_000_000_000)
                .mapToObj(i -> String.format("%09d", i))
                .collect(Collectors.joining(","));
    }

    private static String resolveRefreshToken(RefreshRequest request, String cookieRefreshToken) {
        if (request != null && request.refreshToken() != null && !request.refreshToken().isBlank()) {
            return request.refreshToken();
        }
        if (cookieRefreshToken != null && !cookieRefreshToken.isBlank()) {
            return cookieRefreshToken;
        }
        throw new ApiException(401, "Invalid refresh token");
    }

    private User requireCurrentUser() {
        UUID userId = SecurityUtils.currentUserId();
        if (userId == null) {
            throw new ApiException(401, "Unauthorized");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(404, "User not found"));
    }

    private Membership resolveMembership(UUID userId, String organizationSlug) {
        List<Membership> memberships = membershipRepository.findByUserIdAndActiveTrue(userId);
        if (memberships.isEmpty()) {
            throw new ApiException(401, "No active membership");
        }
        if (organizationSlug != null && !organizationSlug.isBlank()) {
            Organization org = organizationRepository.findBySlug(organizationSlug)
                    .orElseThrow(() -> new ApiException(401, "Organization not found"));
            return membershipRepository.findByUserIdAndOrganizationIdAndActiveTrue(userId, org.getId())
                    .orElseThrow(() -> new ApiException(401, "Not a member of this organization"));
        }
        return memberships.getFirst();
    }

    private TokenResponse buildTokenResponse(User user, Organization org, Role role) {
        String accessToken = jwtService.generateAccessToken(user.getId(), org.getId(), role, user.getEmail());
        String refreshTokenValue = UUID.randomUUID().toString();

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserId(user.getId());
        refreshToken.setToken(refreshTokenValue);
        refreshToken.setExpiresAt(Instant.now().plusMillis(jwtService.getRefreshTokenExpirationMs()));
        refreshTokenRepository.save(refreshToken);

        return new TokenResponse(
                accessToken, refreshTokenValue, jwtService.getAccessTokenExpirationMs(),
                user.getId(), org.getId(), role);
    }

    private String uniqueSlug(String companyName) {
        String base = Normalizer.normalize(companyName, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        if (base.isBlank()) base = "entreprise";
        String candidate = base;
        int i = 1;
        while (organizationRepository.findBySlug(candidate).isPresent()) {
            candidate = base + "-" + i++;
        }
        return candidate;
    }

    private static String defaultWorkspaceConfigJson() {
        return """
                {"branding":{"primaryColor":"#3EC4FF","secondaryColor":"#5EEAD4","accentColor":"#67E8F9","themePreset":"cyberpunk-dark","logoDisplayMode":"plaque","logoScale":1,"carpetStyle":"futuristic","carpetScale":1,"carpetOpacity":0.92},"office":{"wallTheme":"slate","floorTheme":"carpet","deskTheme":"executive","lightingTheme":"night","neonIntensity":0.55,"animationMode":"pulse","widgets":["activity","alerts"],"accessibilityMode":false},"agents":[],"assistants":[]}
                """.trim();
    }
}
