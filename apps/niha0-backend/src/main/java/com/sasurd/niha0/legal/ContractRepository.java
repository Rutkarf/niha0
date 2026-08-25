package com.sasurd.niha0.legal;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContractRepository extends JpaRepository<Contract, UUID> {
    List<Contract> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    Optional<Contract> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
