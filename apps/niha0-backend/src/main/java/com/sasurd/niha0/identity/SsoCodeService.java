package com.sasurd.niha0.identity;

import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.identity.dto.TokenResponse;
import com.sasurd.niha0.security.JwtService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class SsoCodeService {

    private final SsoCodeRepository ssoCodeRepository;
    private final JwtService jwtService;

    public SsoCodeService(SsoCodeRepository ssoCodeRepository, JwtService jwtService) {
        this.ssoCodeRepository = ssoCodeRepository;
        this.jwtService = jwtService;
    }

    @Transactional
    public UUID createCode(TokenResponse tokens) {
        SsoCode code = new SsoCode();
        code.setUserId(tokens.userId());
        code.setOrganizationId(tokens.organizationId());
        code.setRole(tokens.role());
        code.setAccessToken(tokens.accessToken());
        code.setRefreshToken(tokens.refreshToken());
        code.setExpiresAt(Instant.now().plus(2, ChronoUnit.MINUTES));
        ssoCodeRepository.save(code);
        return code.getId();
    }

    @Transactional
    public TokenResponse exchangeCode(UUID codeId) {
        SsoCode code = ssoCodeRepository.findByIdAndConsumedAtIsNull(codeId)
                .filter(c -> c.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> new ApiException(400, "Invalid or expired SSO code"));

        code.setConsumedAt(Instant.now());
        ssoCodeRepository.save(code);

        return new TokenResponse(
                code.getAccessToken(),
                code.getRefreshToken(),
                jwtService.getAccessTokenExpirationMs(),
                code.getUserId(),
                code.getOrganizationId(),
                code.getRole());
    }
}
