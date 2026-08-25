package com.sasurd.niha0.platform;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/platform")
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
public class PlatformAdminController {

    private final PlatformAdminService platformAdminService;

    public PlatformAdminController(PlatformAdminService platformAdminService) {
        this.platformAdminService = platformAdminService;
    }

    @GetMapping("/organizations")
    public List<PlatformOrgSummary> listOrganizations() {
        return platformAdminService.listOrganizations();
    }

    @PostMapping("/organizations/{id}/suspend")
    public PlatformOrgSummary suspend(@PathVariable UUID id) {
        return platformAdminService.suspend(id, true);
    }

    @PostMapping("/organizations/{id}/unsuspend")
    public PlatformOrgSummary unsuspend(@PathVariable UUID id) {
        return platformAdminService.suspend(id, false);
    }

    @GetMapping("/health-summary")
    public Map<String, Object> healthSummary() {
        List<PlatformOrgSummary> orgs = platformAdminService.listOrganizations();
        long suspended = orgs.stream().filter(o -> "SUSPENDED".equalsIgnoreCase(o.status())).count();
        return Map.of(
                "organizationCount", orgs.size(),
                "suspendedCount", suspended,
                "note", "Impersonation break-glass not enabled in 0.5 — audit-only console");
    }
}
