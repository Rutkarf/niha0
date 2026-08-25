package com.sasurd.niha0.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatThreadRepository extends JpaRepository<ChatThread, UUID> {

    List<ChatThread> findByOrganizationIdOrderByUpdatedAtDesc(UUID organizationId);

    Optional<ChatThread> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
