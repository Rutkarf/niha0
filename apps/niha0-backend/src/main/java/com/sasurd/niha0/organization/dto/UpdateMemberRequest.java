package com.sasurd.niha0.organization.dto;

import com.sasurd.niha0.common.Role;

public record UpdateMemberRequest(
        Role role,
        Boolean active
) {}
