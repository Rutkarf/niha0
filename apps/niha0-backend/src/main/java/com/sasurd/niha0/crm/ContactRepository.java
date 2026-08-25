package com.sasurd.niha0.crm;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContactRepository extends JpaRepository<Contact, UUID> {
    List<Contact> findByOrganizationIdOrderByLastNameAsc(UUID organizationId);
    Optional<Contact> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
