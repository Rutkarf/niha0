package com.sasurd.niha0.customerrelations;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping
    public List<Ticket> list() {
        return ticketService.listTickets();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SUPPORT','MANAGER','MEMBER')")
    public Ticket create(@RequestBody Ticket ticket) {
        return ticketService.createTicket(ticket);
    }

    @GetMapping("/{id}")
    public Ticket get(@PathVariable UUID id) {
        return ticketService.getTicket(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SUPPORT','MANAGER')")
    public Ticket update(@PathVariable UUID id, @RequestBody Ticket ticket) {
        return ticketService.updateTicket(id, ticket);
    }
}
