package com.sasurd.niha0.crm;

import com.sasurd.niha0.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "opportunities")
@Getter
@Setter
public class Opportunity extends TenantEntity {

    @Column(name = "customer_id")
    private UUID customerId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String stage = "QUALIFICATION";

    @Column(nullable = false)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(nullable = false)
    private int probability = 10;

    @Column(name = "expected_close")
    private LocalDate expectedClose;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onPersistOpp() {
        if (updatedAt == null) updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
