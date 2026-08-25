package com.sasurd.niha0.bi;

import com.sasurd.niha0.agents.runtime.AgentRuntimeRunRepository;
import com.sasurd.niha0.dashboard.DashboardKpis;
import com.sasurd.niha0.dashboard.DashboardService;
import com.sasurd.niha0.marketplace.MarketplaceListingRepository;
import com.sasurd.niha0.pim.PimProductRepository;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class BiService {

    private final DashboardService dashboardService;
    private final PimProductRepository pimProductRepository;
    private final MarketplaceListingRepository marketplaceListingRepository;
    private final AgentRuntimeRunRepository agentRuntimeRunRepository;

    public BiService(DashboardService dashboardService,
                     PimProductRepository pimProductRepository,
                     MarketplaceListingRepository marketplaceListingRepository,
                     AgentRuntimeRunRepository agentRuntimeRunRepository) {
        this.dashboardService = dashboardService;
        this.pimProductRepository = pimProductRepository;
        this.marketplaceListingRepository = marketplaceListingRepository;
        this.agentRuntimeRunRepository = agentRuntimeRunRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> report() {
        UUID orgId = SecurityUtils.requireOrganizationId();
        DashboardKpis kpis = dashboardService.getKpis();
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("kpis", kpis);
        report.put("pimProducts", pimProductRepository.countByOrganizationId(orgId));
        report.put("marketplaceListings", marketplaceListingRepository.countByOrganizationId(orgId));
        report.put("runtimeRuns", agentRuntimeRunRepository.countByOrganizationId(orgId));
        return report;
    }
}
