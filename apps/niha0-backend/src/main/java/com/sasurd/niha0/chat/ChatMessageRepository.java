package com.sasurd.niha0.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    List<ChatMessage> findByOrganizationIdAndThreadIdOrderByCreatedAtAsc(UUID organizationId, UUID threadId);
}
