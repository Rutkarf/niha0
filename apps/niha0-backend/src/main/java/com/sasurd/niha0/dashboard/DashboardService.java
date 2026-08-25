package com.sasurd.niha0.dashboard;

import com.sasurd.niha0.accounting.InvoiceRepository;
import com.sasurd.niha0.agents.AgentActionRepository;
import com.sasurd.niha0.agents.AgentRepository;
import com.sasurd.niha0.common.WorkflowStatus;
import com.sasurd.niha0.crm.CustomerRepository;
import com.sasurd.niha0.crm.LeadRepository;
import com.sasurd.niha0.crm.OpportunityRepository;
import com.sasurd.niha0.customerrelations.TicketRepository;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class DashboardService {

    private final CustomerRepository customerRepository;
    private final LeadRepository leadRepository;
    private final OpportunityRepository opportunityRepository;
    private final InvoiceRepository invoiceRepository;
    private final TicketRepository ticketRepository;
    private final AgentRepository agentRepository;
    private final AgentActionRepository agentActionRepository;

    public DashboardService(CustomerRepository customerRepository,
                            LeadRepository leadRepository,
                            OpportunityRepository opportunityRepository,
                            InvoiceRepository invoiceRepository,
                            TicketRepository ticketRepository,
                            AgentRepository agentRepository,
                            AgentActionRepository agentActionRepository) {
        this.customerRepository = customerRepository;
        this.leadRepository = leadRepository;
        this.opportunityRepository = opportunityRepository;
        this.invoiceRepository = invoiceRepository;
        this.ticketRepository = ticketRepository;
        this.agentRepository = agentRepository;
        this.agentActionRepository = agentActionRepository;
    }

    @Transactional(readOnly = true)
    public DashboardKpis getKpis() {
        UUID orgId = SecurityUtils.requireOrganizationId();

        BigDecimal pipeline = opportunityRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                .map(o -> o.getAmount() != null ? o.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new DashboardKpis(
                customerRepository.findByOrganizationIdOrderByNameAsc(orgId).size(),
                leadRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).size(),
                opportunityRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).size(),
                pipeline,
                invoiceRepository.countByOrganizationId(orgId),
                ticketRepository.countByOrganizationIdAndStatus(orgId, "OPEN"),
                agentRepository.findByOrganizationIdOrderByNameAsc(orgId).size(),
                agentActionRepository.countByOrganizationIdAndWorkflowStatus(orgId, WorkflowStatus.REQUEST_APPROVAL));
    }
}
