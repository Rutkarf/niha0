package com.sasurd.niha0.governance;

import com.sasurd.niha0.common.Role;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Resolves permission codes for a membership role from {@code role_permissions}.
 * Falls back to MEMBER-like grants for operational roles not in the seed matrix.
 */
@Service
public class PermissionCatalogService {

    private static final List<String> MEMBER_FALLBACK = List.of(
            "agents.read", "marketplace.install", "chat.use"
    );

    private final RolePermissionRepository rolePermissionRepository;
    private final PermissionRepository permissionRepository;
    private final ConcurrentHashMap<String, List<String>> cache = new ConcurrentHashMap<>();

    public PermissionCatalogService(RolePermissionRepository rolePermissionRepository,
                                    PermissionRepository permissionRepository) {
        this.rolePermissionRepository = rolePermissionRepository;
        this.permissionRepository = permissionRepository;
    }

    @Transactional(readOnly = true)
    public List<String> permissionCodesFor(Role role) {
        if (role == null) {
            return List.of();
        }
        if (role == Role.PLATFORM_ADMIN) {
            return permissionRepository.findAll().stream().map(Permission::getCode).sorted().toList();
        }
        return cache.computeIfAbsent(role.name(), this::loadForRole);
    }

    private List<String> loadForRole(String roleCode) {
        List<String> codes = rolePermissionRepository.findByRoleCode(roleCode).stream()
                .map(RolePermission::getPermissionCode)
                .sorted()
                .toList();
        if (!codes.isEmpty()) {
            return codes;
        }
        // Operational roles (SALES, HR, …) inherit MEMBER baseline until matrix is extended.
        return new ArrayList<>(MEMBER_FALLBACK);
    }

    /** Test / admin hook — clears in-memory cache after role_permissions changes. */
    public void evictCache() {
        cache.clear();
    }

    public Map<Role, List<String>> snapshotKnownRoles() {
        Map<Role, List<String>> map = new EnumMap<>(Role.class);
        for (Role role : Role.values()) {
            if (role == Role.PLATFORM_ADMIN) {
                continue;
            }
            map.put(role, permissionCodesFor(role));
        }
        return map;
    }
}
