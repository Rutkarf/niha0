package com.sasurd.niha0.marketing;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/marketing")
public class MarketingController {

    private final MarketingService marketingService;

    public MarketingController(MarketingService marketingService) {
        this.marketingService = marketingService;
    }

    @GetMapping("/posts")
    public List<MarketingPost> listPosts() {
        return marketingService.listPosts();
    }

    @PostMapping("/posts")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MARKETING','MANAGER')")
    public MarketingPost createPost(@RequestBody MarketingPost post) {
        return marketingService.createPost(post);
    }

    @GetMapping("/campaigns")
    public List<Campaign> listCampaigns() {
        return marketingService.listCampaigns();
    }

    @PostMapping("/campaigns")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MARKETING','MANAGER')")
    public Campaign createCampaign(@RequestBody Campaign campaign) {
        return marketingService.createCampaign(campaign);
    }
}
