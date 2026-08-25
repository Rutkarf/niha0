package com.sasurd.niha0.accounting;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class InvoicePdfService {

    public byte[] render(Invoice invoice) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();
            Font title = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font body = FontFactory.getFont(FontFactory.HELVETICA, 11);
            document.add(new Paragraph("NIHAO — Facture", title));
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Référence : " + nullSafe(invoice.getReference()), body));
            document.add(new Paragraph("Statut : " + nullSafe(invoice.getStatus()), body));
            document.add(new Paragraph("Montant TTC : " + invoice.getTotalAmount(), body));
            document.add(new Paragraph("Payé : " + invoice.getPaidAmount(), body));
            if (invoice.getIssuedAt() != null) {
                document.add(new Paragraph(
                        "Émise le : " + invoice.getIssuedAt().format(DateTimeFormatter.ISO_DATE), body));
            }
            if (invoice.getDueDate() != null) {
                document.add(new Paragraph(
                        "Échéance : " + invoice.getDueDate().format(DateTimeFormatter.ISO_DATE), body));
            }
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Document généré automatiquement — validation humaine requise pour les envois clients.", body));
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to render invoice PDF", e);
        }
    }

    private static String nullSafe(String value) {
        return value == null ? "" : value;
    }
}
