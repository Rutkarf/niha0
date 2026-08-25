package com.sasurd.niha0.security;

import com.sasurd.niha0.common.Role;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Getter
public class Niha0UserDetails implements UserDetails {

    private final UUID userId;
    private final UUID organizationId;
    private final String email;
    private final String passwordHash;
    private final Role role;
    private final boolean active;
    private final List<String> permissionCodes;
    private final Collection<? extends GrantedAuthority> authorities;

    public Niha0UserDetails(UUID userId, UUID organizationId, String email,
                            String passwordHash, Role role, boolean active) {
        this(userId, organizationId, email, passwordHash, role, active, List.of());
    }

    public Niha0UserDetails(UUID userId, UUID organizationId, String email,
                            String passwordHash, Role role, boolean active,
                            Collection<String> permissionCodes) {
        this.userId = userId;
        this.organizationId = organizationId;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.active = active;
        this.permissionCodes = permissionCodes == null
                ? List.of()
                : List.copyOf(permissionCodes);
        List<GrantedAuthority> auths = new ArrayList<>();
        if (role != null) {
            auths.add(new SimpleGrantedAuthority("ROLE_" + role.name()));
        }
        for (String code : this.permissionCodes) {
            if (code != null && !code.isBlank()) {
                auths.add(new SimpleGrantedAuthority(code.trim()));
            }
        }
        this.authorities = List.copyOf(auths);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
