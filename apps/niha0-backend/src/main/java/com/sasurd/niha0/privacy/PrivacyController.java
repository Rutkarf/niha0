package com.sasurd.niha0.privacy;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/privacy")
public class PrivacyController {

    private final PrivacyService privacyService;

    public PrivacyController(PrivacyService privacyService) {
        this.privacyService = privacyService;
    }

    @GetMapping("/export")
    public Map<String, Object> exportPersonalData() {
        return privacyService.exportPersonalData();
    }

    @PostMapping("/erase-me")
    public Map<String, Object> eraseMe() {
        return privacyService.eraseMe();
    }

    @PostMapping("/export-org")
    @PreAuthorize("hasRole('OWNER')")
    public Map<String, Object> exportOrganizationSummary() {
        return privacyService.exportOrganizationSummary();
    }
}
