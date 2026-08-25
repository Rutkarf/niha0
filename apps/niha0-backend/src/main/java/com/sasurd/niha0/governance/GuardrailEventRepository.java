package com.sasurd.niha0.governance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GuardrailEventRepository extends JpaRepository<GuardrailEvent, UUID> {

    List<GuardrailEvent> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
}
