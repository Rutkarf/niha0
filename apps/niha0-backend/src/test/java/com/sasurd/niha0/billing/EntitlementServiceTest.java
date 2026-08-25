package com.sasurd.niha0.billing;

import com.sasurd.niha0.agents.AgentActionRepository;
import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.organization.MembershipRepository;
import com.sasurd.niha0.organization.Organization;
import com.sasurd.niha0.organization.OrganizationInviteRepository;
import com.sasurd.niha0.organization.OrganizationRepository;
import com.sasurd.niha0.storage.StoredAssetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EntitlementServiceTest {

    @Mock OrganizationRepository organizationRepository;
    @Mock MembershipRepository membershipRepository;
    @Mock OrganizationInviteRepository inviteRepository;
    @Mock StoredAssetRepository storedAssetRepository;
    @Mock AgentActionRepository agentActionRepository;

    EntitlementService service;
    UUID orgId;

    @BeforeEach
    void setUp() {
        service = new EntitlementService(
                organizationRepository,
                membershipRepository,
                inviteRepository,
                storedAssetRepository,
                agentActionRepository);
        orgId = UUID.randomUUID();
        Organization org = new Organization();
        org.setId(orgId);
        org.setBillingPlan("FREE");
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
    }

    @Test
    void blocksInviteWhenSeatCapReached() {
        when(membershipRepository.findByOrganizationIdAndActiveTrue(orgId))
                .thenReturn(List.of(new com.sasurd.niha0.organization.Membership(),
                        new com.sasurd.niha0.organization.Membership(),
                        new com.sasurd.niha0.organization.Membership()));
        when(inviteRepository.findByOrganizationIdAndAcceptedAtIsNullOrderByCreatedAtDesc(orgId))
                .thenReturn(List.of());
        assertThatThrownBy(() -> service.assertInviteSlotAvailable(orgId))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Seat limit");
    }

    @Test
    void blocksStorageOverQuota() {
        when(storedAssetRepository.sumSizeBytesByOrganizationId(orgId))
                .thenReturn(100L * 1024 * 1024);
        assertThatThrownBy(() -> service.assertStorageAvailable(orgId, 1))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Storage quota");
    }

    @Test
    void allowsAiUnderDailyCap() {
        when(agentActionRepository.countByOrganizationIdAndCreatedAtAfter(any(), any()))
                .thenReturn(5L);
        assertThatCode(() -> service.assertAiActionAvailable(orgId)).doesNotThrowAnyException();
    }
}
