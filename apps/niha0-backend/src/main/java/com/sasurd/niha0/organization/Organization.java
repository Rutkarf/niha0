package com.sasurd.niha0.organization;

import com.sasurd.niha0.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "organizations")
@Getter
@Setter
public class Organization extends AuditableEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    private String sector;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String website;
    private String country;
    private String city;

    @Column(name = "company_size")
    private String companySize;

    @Column(name = "professional_email")
    private String professionalEmail;

    private String slogan;

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    @Column(name = "logo_asset_id")
    private UUID logoAssetId;

    @Column(name = "onboarding_status", nullable = false)
    private String onboardingStatus = "COMPLETED";

    @Column(name = "workspace_config", columnDefinition = "TEXT")
    private String workspaceConfig;

    @Column(name = "billing_plan", nullable = false, length = 32)
    private String billingPlan = "FREE";

    @Column(name = "billing_customer_ref", length = 128)
    private String billingCustomerRef;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onPersistOrg() {
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
        if (onboardingStatus == null || onboardingStatus.isBlank()) {
            onboardingStatus = "COMPLETED";
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
