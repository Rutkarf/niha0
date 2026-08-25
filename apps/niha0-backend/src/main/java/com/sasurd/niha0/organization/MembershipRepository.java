package com.sasurd.niha0.organization;

import com.sasurd.niha0.common.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MembershipRepository extends JpaRepository<Membership, UUID> {

    List<Membership> findByUserIdAndActiveTrue(UUID userId);

    List<Membership> findByUserId(UUID userId);

    Optional<Membership> findByUserIdAndOrganizationIdAndActiveTrue(UUID userId, UUID organizationId);

    List<Membership> findByOrganizationIdAndActiveTrue(UUID organizationId);

    Optional<Membership> findByIdAndOrganizationId(UUID id, UUID organizationId);

    long countByOrganizationIdAndRoleAndActiveTrue(UUID organizationId, Role role);
}
