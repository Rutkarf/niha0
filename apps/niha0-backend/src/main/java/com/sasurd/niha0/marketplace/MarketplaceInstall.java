package com.sasurd.niha0.marketplace;

import com.sasurd.niha0.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "marketplace_installs")
@Getter
@Setter
public class MarketplaceInstall extends TenantEntity {

    @Column(name = "listing_id", nullable = false)
    private UUID listingId;

    @Column(name = "installed_by")
    private UUID installedBy;

    @Column(name = "config_json", columnDefinition = "TEXT")
    private String configJson;
}
