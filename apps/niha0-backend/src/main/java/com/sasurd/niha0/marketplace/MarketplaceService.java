package com.sasurd.niha0.marketplace;

import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class MarketplaceService {

    private final AgentDefinitionRepository definitionRepository;
    private final MarketplaceListingRepository listingRepository;
    private final MarketplaceInstallRepository installRepository;

    public MarketplaceService(AgentDefinitionRepository definitionRepository,
                              MarketplaceListingRepository listingRepository,
                              MarketplaceInstallRepository installRepository) {
        this.definitionRepository = definitionRepository;
        this.listingRepository = listingRepository;
        this.installRepository = installRepository;
    }

    @Transactional(readOnly = true)
    public List<AgentDefinition> listDefinitions() {
        return definitionRepository.findByOrganizationIdOrderByUpdatedAtDesc(orgId());
    }

    @Transactional(readOnly = true)
    public AgentDefinition getDefinition(UUID id) {
        return definitionRepository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Definition not found"));
    }

    @Transactional
    public AgentDefinition createDefinition(AgentDefinition definition) {
        UUID orgId = orgId();
        if (definition.getSlug() == null || definition.getSlug().isBlank()) {
            throw new ApiException(400, "slug is required");
        }
        if (definition.getName() == null || definition.getName().isBlank()) {
            throw new ApiException(400, "name is required");
        }
        definition.setOrganizationId(orgId);
        definition.setCreatedBy(SecurityUtils.currentUserId());
        if (definition.getVisibility() == null || definition.getVisibility().isBlank()) {
            definition.setVisibility("PRIVATE");
        }
        if (definition.getStatus() == null || definition.getStatus().isBlank()) {
            definition.setStatus("DRAFT");
        }
        if (definition.getVersion() <= 0) {
            definition.setVersion(1);
        }
        return definitionRepository.save(definition);
    }

    @Transactional
    public AgentDefinition updateDefinition(UUID id, AgentDefinition update) {
        AgentDefinition existing = getDefinition(id);
        if (update.getName() != null) existing.setName(update.getName());
        if (update.getDescription() != null) existing.setDescription(update.getDescription());
        if (update.getGraphJson() != null) existing.setGraphJson(update.getGraphJson());
        if (update.getVisibility() != null) existing.setVisibility(update.getVisibility());
        if (update.getStatus() != null) existing.setStatus(update.getStatus());
        if (update.getSlug() != null) existing.setSlug(update.getSlug());
        if (update.getVersion() > 0) existing.setVersion(update.getVersion());
        return definitionRepository.save(existing);
    }

    @Transactional
    public MarketplaceListing publishListing(UUID definitionId, String title, String summary, String visibility) {
        AgentDefinition definition = getDefinition(definitionId);
        MarketplaceListing listing = new MarketplaceListing();
        listing.setOrganizationId(orgId());
        listing.setDefinitionId(definition.getId());
        listing.setTitle(title == null || title.isBlank() ? definition.getName() : title.trim());
        listing.setSummary(summary);
        String vis = visibility == null || visibility.isBlank() ? "PRIVATE" : visibility.trim().toUpperCase(Locale.ROOT);
        if (!List.of("PRIVATE", "PUBLIC").contains(vis)) {
            throw new ApiException(400, "visibility must be PRIVATE or PUBLIC");
        }
        listing.setVisibility(vis);
        listing.setCategory("agent");
        listing.setPublishedAt(Instant.now());
        definition.setStatus("PUBLISHED");
        definition.setVisibility(vis);
        definitionRepository.save(definition);
        return listingRepository.save(listing);
    }

    @Transactional(readOnly = true)
    public List<MarketplaceListing> listCatalog(String visibilityFilter) {
        UUID orgId = orgId();
        List<MarketplaceListing> catalog = listingRepository.findCatalogForOrg(orgId);
        if (visibilityFilter == null || visibilityFilter.isBlank()) {
            return catalog;
        }
        String filter = visibilityFilter.trim().toUpperCase(Locale.ROOT);
        return catalog.stream().filter(l -> filter.equals(l.getVisibility())).toList();
    }

    @Transactional(readOnly = true)
    public List<MarketplaceInstall> listInstalls() {
        return installRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId());
    }

    @Transactional
    public MarketplaceInstall install(UUID listingId, String configJson) {
        UUID orgId = orgId();
        MarketplaceListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ApiException(404, "Listing not found"));
        boolean visible = "PUBLIC".equalsIgnoreCase(listing.getVisibility())
                || orgId.equals(listing.getOrganizationId());
        if (!visible) {
            throw new ApiException(403, "Listing not available");
        }
        if (installRepository.findByOrganizationIdAndListingId(orgId, listingId).isPresent()) {
            throw new ApiException(409, "Already installed");
        }
        MarketplaceInstall install = new MarketplaceInstall();
        install.setOrganizationId(orgId);
        install.setListingId(listingId);
        install.setInstalledBy(SecurityUtils.currentUserId());
        install.setConfigJson(configJson);
        listing.setInstallCount(listing.getInstallCount() + 1);
        listingRepository.save(listing);
        return installRepository.save(install);
    }

    private UUID orgId() {
        return SecurityUtils.requireOrganizationId();
    }
}
