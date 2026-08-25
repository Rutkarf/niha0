package com.sasurd.niha0;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AccountingFlowTest {

    @Autowired MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    static String token;
    static UUID quoteId;
    static UUID invoiceId;

    @BeforeEach
    void ensureToken() throws Exception {
        if (token != null) return;
        String email = "acct-" + UUID.randomUUID() + "@example.test";
        MvcResult reg = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"Demo2026!","firstName":"Ann","lastName":"Acc",
                                 "companyName":"Acc Corp %s","sector":"Services"}
                                """.formatted(email, UUID.randomUUID())))
                .andExpect(status().isOk())
                .andReturn();
        token = objectMapper.readTree(reg.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @Test
    @Order(1)
    void quoteToInvoiceToPaymentAndPdf() throws Exception {
        MvcResult quoteRes = mockMvc.perform(post("/accounting/quotes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"reference":"Q-100","status":"SENT","totalAmount":1200.00}
                                """))
                .andExpect(status().isOk())
                .andReturn();
        quoteId = UUID.fromString(objectMapper.readTree(quoteRes.getResponse().getContentAsString()).get("id").asText());

        MvcResult invRes = mockMvc.perform(post("/accounting/quotes/" + quoteId + "/convert-to-invoice")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode invoice = objectMapper.readTree(invRes.getResponse().getContentAsString());
        invoiceId = UUID.fromString(invoice.get("id").asText());
        assertThat(invoice.get("reference").asText()).startsWith("INV-");
        assertThat(invoice.get("status").asText()).isEqualTo("ISSUED");

        mockMvc.perform(post("/accounting/payments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"invoiceId":"%s","amount":1200.00,"status":"COMPLETED","method":"TRANSFER"}
                                """.formatted(invoiceId)))
                .andExpect(status().isOk());

        MvcResult paid = mockMvc.perform(get("/accounting/invoices/" + invoiceId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(objectMapper.readTree(paid.getResponse().getContentAsString()).get("status").asText())
                .isEqualTo("PAID");

        MvcResult pdf = mockMvc.perform(get("/accounting/invoices/" + invoiceId + "/pdf")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(pdf.getResponse().getContentType()).contains("pdf");
        assertThat(pdf.getResponse().getContentAsByteArray().length).isGreaterThan(100);
    }
}
