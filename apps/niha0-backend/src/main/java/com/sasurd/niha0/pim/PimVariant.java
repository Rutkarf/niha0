package com.sasurd.niha0.pim;

import com.sasurd.niha0.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "pim_variants")
@Getter
@Setter
public class PimVariant extends TenantEntity {

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(nullable = false, length = 64)
    private String sku;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "price_cents", nullable = false)
    private int priceCents = 0;

    @Column(nullable = false, length = 8)
    private String currency = "EUR";

    @Column(nullable = false, length = 64)
    private String status = "ACTIVE";

    @Column(name = "attributes_json", columnDefinition = "TEXT")
    private String attributesJson;
}
