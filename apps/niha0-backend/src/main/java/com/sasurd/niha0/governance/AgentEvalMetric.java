package com.sasurd.niha0.governance;

import com.sasurd.niha0.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "agent_eval_metrics")
@Getter
@Setter
public class AgentEvalMetric extends TenantEntity {

    @Column(name = "metric_date", nullable = false)
    private LocalDate metricDate = LocalDate.now();

    @Column(nullable = false)
    private int recommendations = 0;

    @Column(nullable = false)
    private int approvals = 0;

    @Column(nullable = false)
    private int rejections = 0;

    @Column(nullable = false)
    private int escalations = 0;

    @Column(name = "avg_latency_ms", nullable = false)
    private int avgLatencyMs = 0;

    @Column(name = "estimated_cost_cents", nullable = false)
    private int estimatedCostCents = 0;
}
