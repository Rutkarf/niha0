package com.sasurd.niha0.governance;

import com.sasurd.niha0.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "tool_sandbox_logs")
@Getter
@Setter
public class ToolSandboxLog extends TenantEntity {

    @Column(name = "tool_name", nullable = false, length = 120)
    private String toolName;

    @Column(nullable = false)
    private boolean allowed;

    @Column(name = "duration_ms", nullable = false)
    private int durationMs = 0;

    @Column(columnDefinition = "TEXT")
    private String detail;

    @Column(name = "created_by")
    private UUID createdBy;
}
