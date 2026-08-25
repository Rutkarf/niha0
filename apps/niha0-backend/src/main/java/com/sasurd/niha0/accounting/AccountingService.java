package com.sasurd.niha0.accounting;

import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class AccountingService {

    private final QuoteRepository quoteRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final InvoicePdfService invoicePdfService;

    public AccountingService(QuoteRepository quoteRepository,
                             InvoiceRepository invoiceRepository,
                             PaymentRepository paymentRepository,
                             InvoicePdfService invoicePdfService) {
        this.quoteRepository = quoteRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.invoicePdfService = invoicePdfService;
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

    @Transactional
    public Invoice convertQuoteToInvoice(UUID quoteId) {
        Quote quote = quoteRepository.findByIdAndOrganizationId(quoteId, orgId())
                .orElseThrow(() -> new ApiException(404, "Quote not found"));
        if ("INVOICED".equalsIgnoreCase(quote.getStatus()) || "REJECTED".equalsIgnoreCase(quote.getStatus())) {
            throw new ApiException(409, "Quote cannot be converted (status=" + quote.getStatus() + ")");
        }
        Invoice invoice = new Invoice();
        invoice.setOrganizationId(orgId());
        invoice.setCustomerId(quote.getCustomerId());
        invoice.setReference("INV-" + quote.getReference());
        invoice.setStatus("ISSUED");
        invoice.setTotalAmount(quote.getTotalAmount() == null ? BigDecimal.ZERO : quote.getTotalAmount());
        invoice.setPaidAmount(BigDecimal.ZERO);
        invoice.setIssuedAt(LocalDate.now());
        invoice.setDueDate(LocalDate.now().plusDays(30));
        Invoice saved = invoiceRepository.save(invoice);
        quote.setStatus("INVOICED");
        quoteRepository.save(quote);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Invoice> listInvoices() {
        return invoiceRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId());
    }

    @Transactional
    public Invoice createInvoice(Invoice invoice) {
        invoice.setOrganizationId(orgId());
        if (invoice.getIssuedAt() == null) {
            invoice.setIssuedAt(LocalDate.now());
        }
        return invoiceRepository.save(invoice);
    }

    @Transactional(readOnly = true)
    public Invoice getInvoice(UUID id) {
        return invoiceRepository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Invoice not found"));
    }

    @Transactional(readOnly = true)
    public byte[] invoicePdf(UUID id) {
        return invoicePdfService.render(getInvoice(id));
    }

    @Transactional(readOnly = true)
    public List<Payment> listPayments() {
        return paymentRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId());
    }

    @Transactional
    public Payment createPayment(Payment payment) {
        payment.setOrganizationId(orgId());
        Payment saved = paymentRepository.save(payment);
        if (payment.getInvoiceId() != null && payment.getAmount() != null) {
            Invoice invoice = invoiceRepository.findByIdAndOrganizationId(payment.getInvoiceId(), orgId())
                    .orElseThrow(() -> new ApiException(404, "Invoice not found"));
            BigDecimal paid = invoice.getPaidAmount() == null ? BigDecimal.ZERO : invoice.getPaidAmount();
            invoice.setPaidAmount(paid.add(payment.getAmount()));
            if (invoice.getPaidAmount().compareTo(invoice.getTotalAmount()) >= 0) {
                invoice.setStatus("PAID");
            } else {
                invoice.setStatus("PARTIAL");
            }
            invoiceRepository.save(invoice);
        }
        return saved;
    }

    private UUID orgId() {
        return SecurityUtils.requireOrganizationId();
    }
}
