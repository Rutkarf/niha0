package com.sasurd.niha0.security;

import com.sasurd.niha0.common.Role;
import com.sasurd.niha0.tenancy.TenantContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static UUID currentUserId() {
        UUID fromContext = TenantContext.userId();
        if (fromContext != null) {
            return fromContext;
        }
        Niha0UserDetails details = currentUserDetails();
        return details != null ? details.getUserId() : null;
    }

    public static UUID currentOrganizationId() {
        UUID fromContext = TenantContext.orgId();
        if (fromContext != null) {
            return fromContext;
        }
        Niha0UserDetails details = currentUserDetails();
        return details != null ? details.getOrganizationId() : null;
    }

    public static Role currentRole() {
        Niha0UserDetails details = currentUserDetails();
        return details != null ? details.getRole() : null;
    }

    public static Niha0UserDetails currentUserDetails() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Niha0UserDetails details) {
            return details;
        }
        return null;
    }

    public static UUID requireOrganizationId() {
        UUID orgId = currentOrganizationId();
        if (orgId == null) {
            throw new IllegalStateException("No organization in security context");
        }
        return orgId;
    }
}
