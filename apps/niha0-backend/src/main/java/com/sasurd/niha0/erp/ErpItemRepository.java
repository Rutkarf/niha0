package com.sasurd.niha0.erp;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ErpItemRepository extends JpaRepository<ErpItem, UUID> {

    List<ErpItem> findByOrganizationIdAndModuleOrderByUpdatedAtDesc(UUID organizationId, ErpModule module);

    Optional<ErpItem> findByIdAndOrganizationIdAndModule(UUID id, UUID organizationId, ErpModule module);

    boolean existsByOrganizationIdAndModuleAndCodeIgnoreCase(UUID organizationId, ErpModule module, String code);
}
