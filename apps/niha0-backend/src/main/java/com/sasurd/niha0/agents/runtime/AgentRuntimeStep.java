package com.sasurd.niha0.agents.runtime;

import com.sasurd.niha0.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "agent_runtime_steps")
@Getter
@Setter
public class AgentRuntimeStep extends TenantEntity {

    @Column(name = "run_id", nullable = false)
    private UUID runId;

    @Column(name = "node_name", nullable = false, length = 120)
    private String nodeName;

    @Column(name = "step_index", nullable = false)
    private int stepIndex = 0;

    @Column(name = "input_json", columnDefinition = "TEXT")
    private String inputJson;

    @Column(name = "output_json", columnDefinition = "TEXT")
    private String outputJson;

    @Column(nullable = false, length = 64)
    private String status = "DONE";

    @Column(name = "latency_ms", nullable = false)
    private int latencyMs = 0;
}
