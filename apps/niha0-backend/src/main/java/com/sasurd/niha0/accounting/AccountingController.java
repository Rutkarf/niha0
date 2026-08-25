package com.sasurd.niha0.accounting;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

    @PostMapping("/quotes/{id}/convert-to-invoice")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','ACCOUNTANT')")
    public Invoice convertQuoteToInvoice(@PathVariable UUID id) {
        return accountingService.convertQuoteToInvoice(id);
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

    @GetMapping("/invoices/{id}/pdf")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','ACCOUNTANT','MANAGER')")
    public ResponseEntity<byte[]> invoicePdf(@PathVariable UUID id) {
        byte[] pdf = accountingService.invoicePdf(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"invoice-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
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
