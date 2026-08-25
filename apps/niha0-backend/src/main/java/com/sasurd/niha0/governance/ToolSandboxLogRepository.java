package com.sasurd.niha0.governance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ToolSandboxLogRepository extends JpaRepository<ToolSandboxLog, UUID> {

    List<ToolSandboxLog> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
}
