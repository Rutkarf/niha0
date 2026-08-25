package com.sasurd.niha0.customerrelations;

import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;

    public TicketService(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    @Transactional(readOnly = true)
    public List<Ticket> listTickets() {
        return ticketRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId());
    }

    @Transactional
    public Ticket createTicket(Ticket ticket) {
        ticket.setOrganizationId(orgId());
        return ticketRepository.save(ticket);
    }

    @Transactional(readOnly = true)
    public Ticket getTicket(UUID id) {
        return ticketRepository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Ticket not found"));
    }

    @Transactional
    public Ticket updateTicket(UUID id, Ticket update) {
        Ticket existing = getTicket(id);
        existing.setSubject(update.getSubject());
        existing.setDescription(update.getDescription());
        existing.setStatus(update.getStatus());
        existing.setPriority(update.getPriority());
        existing.setSatisfaction(update.getSatisfaction());
        return ticketRepository.save(existing);
    }

    private UUID orgId() {
        return SecurityUtils.requireOrganizationId();
    }
}
