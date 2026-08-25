package com.sasurd.niha0.organization;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationInviteRepository extends JpaRepository<OrganizationInvite, UUID> {

    List<OrganizationInvite> findByOrganizationIdAndAcceptedAtIsNullOrderByCreatedAtDesc(UUID organizationId);

    Optional<OrganizationInvite> findByToken(UUID token);
}
