package com.sasurd.niha0.hr;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {
    List<LeaveRequest> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    Optional<LeaveRequest> findByIdAndOrganizationId(UUID id, UUID organizationId);
    List<LeaveRequest> findByOrganizationIdAndStatusOrderByCreatedAtDesc(UUID organizationId, String status);
}
