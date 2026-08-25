package com.sasurd.niha0.privacy;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PrivacyRequestRepository extends JpaRepository<PrivacyRequest, UUID> {
}
