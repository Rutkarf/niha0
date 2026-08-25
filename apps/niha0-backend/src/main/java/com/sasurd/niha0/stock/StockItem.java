package com.sasurd.niha0.stock;

import com.sasurd.niha0.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "stock_items")
@Getter
@Setter
public class StockItem extends TenantEntity {

    @Column(nullable = false, length = 64)
    private String sku;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private int quantity = 0;

    @Column(name = "reorder_level", nullable = false)
    private int reorderLevel = 10;

    @Column(nullable = false, length = 32)
    private String unit = "unit";

    private String location;

    @Column(nullable = false)
    private String status = "ACTIVE";

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onPersist() {
        if (updatedAt == null) updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
