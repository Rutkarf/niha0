package com.sasurd.niha0.governance;

import com.sasurd.niha0.common.Role;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class GovernanceService {

    private final RolePermissionRepository rolePermissionRepository;
    private final PermissionRepository permissionRepository;
    private final GuardrailEventRepository guardrailEventRepository;
    private final ToolSandboxLogRepository toolSandboxLogRepository;
    private final EvalService evalService;
    private final GuardrailService guardrailService;

    public GovernanceService(RolePermissionRepository rolePermissionRepository,
                             PermissionRepository permissionRepository,
                             GuardrailEventRepository guardrailEventRepository,
                             ToolSandboxLogRepository toolSandboxLogRepository,
                             EvalService evalService,
                             GuardrailService guardrailService) {
        this.rolePermissionRepository = rolePermissionRepository;
        this.permissionRepository = permissionRepository;
        this.guardrailEventRepository = guardrailEventRepository;
        this.toolSandboxLogRepository = toolSandboxLogRepository;
        this.evalService = evalService;
        this.guardrailService = guardrailService;
    }

    @Transactional(readOnly = true)
    public List<Permission> listPermissionsForCurrentRole() {
        Role role = SecurityUtils.currentRole();
        String roleCode = role == null ? "VIEWER" : role.name();
        List<RolePermission> mappings = rolePermissionRepository.findByRoleCode(roleCode);
        return mappings.stream()
                .map(RolePermission::getPermissionCode)
                .map(code -> permissionRepository.findByCode(code).orElse(null))
                .filter(Objects::nonNull)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GuardrailEvent> listGuardrailEvents() {
        return guardrailEventRepository.findByOrganizationIdOrderByCreatedAtDesc(
                SecurityUtils.requireOrganizationId());
    }

    @Transactional(readOnly = true)
    public List<ToolSandboxLog> listSandboxLogs() {
        return toolSandboxLogRepository.findByOrganizationIdOrderByCreatedAtDesc(
                SecurityUtils.requireOrganizationId());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> evalDashboard() {
        return evalService.getDashboard();
    }

    @Transactional
    public GuardrailService.ScanResult scan(String text) {
        return guardrailService.scanText(text);
    }
}
