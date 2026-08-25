package com.sasurd.niha0.accounting;

import com.sasurd.niha0.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "quotes")
@Getter
@Setter
public class Quote extends TenantEntity {

    @Column(name = "customer_id")
    private UUID customerId;

    @Column(nullable = false)
    private String reference;

    @Column(nullable = false)
    private String status = "DRAFT";

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "valid_until")
    private LocalDate validUntil;
}
