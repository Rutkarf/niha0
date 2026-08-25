package com.sasurd.niha0.governance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface AgentEvalMetricRepository extends JpaRepository<AgentEvalMetric, UUID> {

    Optional<AgentEvalMetric> findByOrganizationIdAndMetricDate(UUID organizationId, LocalDate metricDate);
}
