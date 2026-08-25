package com.sasurd.niha0.stock;

import com.sasurd.niha0.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "stock_movements")
@Getter
@Setter
public class StockMovement extends TenantEntity {

    @Column(name = "stock_item_id", nullable = false)
    private UUID stockItemId;

    @Column(name = "movement_type", nullable = false, length = 32)
    private String movementType;

    @Column(nullable = false)
    private int quantity;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_by")
    private UUID createdBy;
}
