package com.sasurd.niha0.marketplace;

import com.sasurd.niha0.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "marketplace_listings")
@Getter
@Setter
public class MarketplaceListing extends TenantEntity {

    @Column(name = "definition_id", nullable = false)
    private UUID definitionId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(nullable = false, length = 32)
    private String visibility = "PRIVATE";

    @Column(nullable = false, length = 80)
    private String category = "agent";

    @Column(name = "install_count", nullable = false)
    private int installCount = 0;

    @Column(name = "published_at")
    private Instant publishedAt;
}
