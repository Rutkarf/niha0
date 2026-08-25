package com.sasurd.niha0.marketing;

import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class MarketingService {

    private final MarketingPostRepository postRepository;
    private final CampaignRepository campaignRepository;

    public MarketingService(MarketingPostRepository postRepository, CampaignRepository campaignRepository) {
        this.postRepository = postRepository;
        this.campaignRepository = campaignRepository;
    }

    @Transactional(readOnly = true)
    public List<MarketingPost> listPosts() {
        return postRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId());
    }

    @Transactional
    public MarketingPost createPost(MarketingPost post) {
        post.setOrganizationId(orgId());
        return postRepository.save(post);
    }

    @Transactional(readOnly = true)
    public List<Campaign> listCampaigns() {
        return campaignRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId());
    }

    @Transactional
    public Campaign createCampaign(Campaign campaign) {
        campaign.setOrganizationId(orgId());
        return campaignRepository.save(campaign);
    }

    private UUID orgId() {
        return SecurityUtils.requireOrganizationId();
    }
}
