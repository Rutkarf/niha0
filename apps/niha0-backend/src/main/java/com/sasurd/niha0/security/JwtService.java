package com.sasurd.niha0.security;

import com.sasurd.niha0.common.Role;
import com.sasurd.niha0.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtService {

    private final JwtProperties properties;
    private final SecretKey secretKey;
    private final List<SecretKey> verificationKeys;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        String secret = properties.getSecret();
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "niha0.jwt.secret is empty. Set JWT_SECRET or activate profile 'local'.");
        }
        this.secretKey = toKey(secret);
        List<SecretKey> keys = new ArrayList<>();
        keys.add(this.secretKey);
        String previous = properties.getPreviousSecret();
        if (previous != null && !previous.isBlank() && !previous.equals(secret)) {
            keys.add(toKey(previous));
        }
        this.verificationKeys = List.copyOf(keys);
    }

    private static SecretKey toKey(String secret) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            keyBytes = Decoders.BASE64.decode(
                    java.util.Base64.getEncoder().encodeToString(keyBytes));
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateAccessToken(UUID userId, UUID organizationId, Role role, String email) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(properties.getAccessTokenExpirationMs());
        return Jwts.builder()
                .subject(email)
                .claims(Map.of(
                        "userId", userId.toString(),
                        "organizationId", organizationId.toString(),
                        "role", role.name()))
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(secretKey)
                .compact();
    }

    public Claims parseClaims(String token) {
        JwtException last = null;
        for (SecretKey key : verificationKeys) {
            try {
                return Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();
            } catch (JwtException ex) {
                last = ex;
            }
        }
        throw last != null ? last : new JwtException("Invalid JWT");
    }

    public UUID extractUserId(Claims claims) {
        return UUID.fromString(claims.get("userId", String.class));
    }

    public UUID extractOrganizationId(Claims claims) {
        return UUID.fromString(claims.get("organizationId", String.class));
    }

    public Role extractRole(Claims claims) {
        return Role.valueOf(claims.get("role", String.class));
    }

    public long getAccessTokenExpirationMs() {
        return properties.getAccessTokenExpirationMs();
    }

    public long getRefreshTokenExpirationMs() {
        return properties.getRefreshTokenExpirationMs();
    }

    public String generateMfaToken(UUID userId, UUID organizationId, Role role, String email) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(300);
        return Jwts.builder()
                .subject(email)
                .claim("type", "mfa")
                .claims(Map.of(
                        "userId", userId.toString(),
                        "organizationId", organizationId.toString(),
                        "role", role.name()))
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(secretKey)
                .compact();
    }

    public boolean isMfaToken(Claims claims) {
        return "mfa".equals(claims.get("type", String.class));
    }
}
