package com.sasurd.niha0.identity;

import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Service
public class ThemePreferenceService {

    private static final Set<String> ALLOWED = Set.of("AUTO", "SOLARPUNK", "CYBERPUNK");

    private final ThemePreferenceRepository repository;

    public ThemePreferenceService(ThemePreferenceRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public ThemePreferenceResponse get() {
        UUID userId = SecurityUtils.currentUserId();
        return repository.findByUserId(userId)
                .map(p -> new ThemePreferenceResponse(p.getMode()))
                .orElse(new ThemePreferenceResponse("AUTO"));
    }

    @Transactional
    public ThemePreferenceResponse update(ThemePreferenceRequest request) {
        String mode = request.mode() == null ? "AUTO" : request.mode().trim().toUpperCase();
        if (!ALLOWED.contains(mode)) {
            throw new ApiException(400, "Invalid theme mode");
        }
        UUID userId = SecurityUtils.currentUserId();
        ThemePreference pref = repository.findByUserId(userId).orElseGet(ThemePreference::new);
        pref.setUserId(userId);
        pref.setMode(mode);
        pref.setUpdatedAt(Instant.now());
        repository.save(pref);
        return new ThemePreferenceResponse(mode);
    }

    public record ThemePreferenceRequest(String mode) {}
    public record ThemePreferenceResponse(String mode) {}
}
