package com.sasurd.niha0.hr;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    List<Employee> findByOrganizationIdOrderByLastNameAsc(UUID organizationId);
    Optional<Employee> findByIdAndOrganizationId(UUID id, UUID organizationId);
    Optional<Employee> findFirstByOrganizationIdAndLastNameIgnoreCaseContaining(UUID organizationId, String lastName);
}
