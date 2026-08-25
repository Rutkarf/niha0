package com.sasurd.niha0.governance;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/governance")
@PreAuthorize("isAuthenticated()")
public class GovernanceController {

    private final GovernanceService governanceService;

    public GovernanceController(GovernanceService governanceService) {
        this.governanceService = governanceService;
    }

    @GetMapping("/permissions/me")
    public List<Permission> permissionsMe() {
        return governanceService.listPermissionsForCurrentRole();
    }

    @GetMapping("/guardrails")
    @PreAuthorize("hasAuthority('governance.admin')")
    public List<GuardrailEvent> guardrails() {
        return governanceService.listGuardrailEvents();
    }

    @GetMapping("/sandbox")
    @PreAuthorize("hasAuthority('governance.admin')")
    public List<ToolSandboxLog> sandbox() {
        return governanceService.listSandboxLogs();
    }

    @GetMapping("/eval")
    @PreAuthorize("hasAuthority('governance.admin')")
    public Map<String, Object> eval() {
        return governanceService.evalDashboard();
    }

    @PostMapping("/guardrails/scan")
    @PreAuthorize("hasAuthority('governance.admin')")
    public Map<String, Object> scan(@RequestBody Map<String, String> body) {
        String text = body == null ? "" : body.getOrDefault("text", "");
        GuardrailService.ScanResult result = governanceService.scan(text);
        return Map.of(
                "blocked", result.blocked(),
                "reason", result.reason(),
                "eventId", result.event().getId()
        );
    }
}
