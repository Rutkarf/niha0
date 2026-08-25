package com.sasurd.niha0.marketing;

import com.sasurd.niha0.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "marketing_posts")
@Getter
@Setter
public class MarketingPost extends TenantEntity {

    @Column(nullable = false)
    private String title;

    private String channel;

    @Column(nullable = false)
    private String status = "DRAFT";

    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private int engagement = 0;
}
