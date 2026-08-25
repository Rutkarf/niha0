package com.sasurd.niha0.dashboard;

import java.math.BigDecimal;

public record DashboardKpis(
        long customerCount,
        long leadCount,
        long openOpportunityCount,
        BigDecimal pipelineAmount,
        long invoiceCount,
        long openTicketCount,
        long agentCount,
        long pendingApprovalCount
) {}
