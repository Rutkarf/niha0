package com.sasurd.niha0.governance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "role_permissions")
@IdClass(RolePermissionId.class)
@Getter
@Setter
public class RolePermission {

    @Id
    @Column(name = "role_code", nullable = false, length = 64)
    private String roleCode;

    @Id
    @Column(name = "permission_code", nullable = false, length = 80)
    private String permissionCode;
}
