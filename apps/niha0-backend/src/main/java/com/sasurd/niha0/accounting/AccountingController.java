package com.sasurd.niha0.accounting;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/accounting")
public class AccountingController {

    private final AccountingService accountingService;

    public AccountingController(AccountingService accountingService) {
        this.accountingService = accountingService;
    }

    @GetMapping("/quotes")
    public List<Quote> listQuotes() {
        return accountingService.listQuotes();
    }

    @PostMapping("/quotes")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','ACCOUNTANT','MANAGER')")
    public Quote createQuote(@RequestBody Quote quote) {
        return accountingService.createQuote(quote);
    }

    @GetMapping("/invoices")
    public List<Invoice> listInvoices() {
        return accountingService.listInvoices();
    }

    @PostMapping("/invoices")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','ACCOUNTANT')")
    public Invoice createInvoice(@RequestBody Invoice invoice) {
        return accountingService.createInvoice(invoice);
    }

    @GetMapping("/invoices/{id}")
    public Invoice getInvoice(@PathVariable UUID id) {
        return accountingService.getInvoice(id);
    }

    @GetMapping("/payments")
    public List<Payment> listPayments() {
        return accountingService.listPayments();
    }

    @PostMapping("/payments")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','ACCOUNTANT')")
    public Payment createPayment(@RequestBody Payment payment) {
        return accountingService.createPayment(payment);
    }
}
