package com.sasurd.niha0.accounting;

import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AccountingService {

    private final QuoteRepository quoteRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

    public AccountingService(QuoteRepository quoteRepository,
                             InvoiceRepository invoiceRepository,
                             PaymentRepository paymentRepository) {
        this.quoteRepository = quoteRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional(readOnly = true)
    public List<Quote> listQuotes() {
        return quoteRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId());
    }

    @Transactional
    public Quote createQuote(Quote quote) {
        quote.setOrganizationId(orgId());
        return quoteRepository.save(quote);
    }

    @Transactional(readOnly = true)
    public List<Invoice> listInvoices() {
        return invoiceRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId());
    }

    @Transactional
    public Invoice createInvoice(Invoice invoice) {
        invoice.setOrganizationId(orgId());
        return invoiceRepository.save(invoice);
    }

    @Transactional(readOnly = true)
    public Invoice getInvoice(UUID id) {
        return invoiceRepository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Invoice not found"));
    }

    @Transactional(readOnly = true)
    public List<Payment> listPayments() {
        return paymentRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId());
    }

    @Transactional
    public Payment createPayment(Payment payment) {
        payment.setOrganizationId(orgId());
        return paymentRepository.save(payment);
    }

    private UUID orgId() {
        return SecurityUtils.requireOrganizationId();
    }
}
