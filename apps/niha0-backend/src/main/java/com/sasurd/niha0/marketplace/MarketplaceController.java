package com.sasurd.niha0.marketplace;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@PreAuthorize("isAuthenticated()")
public class MarketplaceController {

    private final MarketplaceService marketplaceService;

    public MarketplaceController(MarketplaceService marketplaceService) {
        this.marketplaceService = marketplaceService;
    }

    @GetMapping("/studio/definitions")
    @PreAuthorize("hasAuthority('studio.edit') or hasAuthority('agents.read')")
    public List<AgentDefinition> listDefinitions() {
        return marketplaceService.listDefinitions();
    }

    @PostMapping("/studio/definitions")
    @PreAuthorize("hasAuthority('studio.edit')")
    public AgentDefinition createDefinition(@RequestBody AgentDefinition definition) {
        return marketplaceService.createDefinition(definition);
    }

    @PutMapping("/studio/definitions/{id}")
    @PreAuthorize("hasAuthority('studio.edit')")
    public AgentDefinition updateDefinition(@PathVariable UUID id, @RequestBody AgentDefinition definition) {
        return marketplaceService.updateDefinition(id, definition);
    }

    @GetMapping("/studio/definitions/{id}")
    @PreAuthorize("hasAuthority('studio.edit') or hasAuthority('agents.read')")
    public AgentDefinition getDefinition(@PathVariable UUID id) {
        return marketplaceService.getDefinition(id);
    }

    @GetMapping("/marketplace/listings")
    @PreAuthorize("hasAuthority('marketplace.install') or hasAuthority('marketplace.publish') or hasAuthority('agents.read')")
    public List<MarketplaceListing> listListings(@RequestParam(required = false) String visibility) {
        return marketplaceService.listCatalog(visibility);
    }

    @PostMapping("/marketplace/listings")
    @PreAuthorize("hasAuthority('marketplace.publish')")
    public MarketplaceListing publish(@RequestBody Map<String, Object> body) {
        UUID definitionId = UUID.fromString(body.get("definitionId").toString());
        String title = body.get("title") != null ? body.get("title").toString() : null;
        String summary = body.get("summary") != null ? body.get("summary").toString() : null;
        String visibility = body.get("visibility") != null ? body.get("visibility").toString() : "PRIVATE";
        return marketplaceService.publishListing(definitionId, title, summary, visibility);
    }

    @GetMapping("/marketplace/installs")
    @PreAuthorize("hasAuthority('marketplace.install') or hasAuthority('agents.read')")
    public List<MarketplaceInstall> listInstalls() {
        return marketplaceService.listInstalls();
    }

    @PostMapping("/marketplace/installs")
    @PreAuthorize("hasAuthority('marketplace.install')")
    public MarketplaceInstall install(@RequestBody Map<String, Object> body) {
        UUID listingId = UUID.fromString(body.get("listingId").toString());
        String configJson = body.get("configJson") != null ? body.get("configJson").toString() : null;
        return marketplaceService.install(listingId, configJson);
    }
}
