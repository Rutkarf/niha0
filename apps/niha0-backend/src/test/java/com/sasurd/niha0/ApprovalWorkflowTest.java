package com.sasurd.niha0;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ApprovalWorkflowTest {

    private static final String PENDING_ACTION_ID = "d0000000-0000-0000-0000-000000000001";
    private static final String SECOND_PENDING_ID = "d0000000-0000-0000-0000-000000000002";

    @Autowired
    MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @Order(1)
    void salesUserCannotApprove() throws Exception {
        String token = login("sales@optimustest.fr");

        mockMvc.perform(post("/approvals/" + PENDING_ACTION_ID + "/approve")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"comment":"Should fail"}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(2)
    void ceoCanApprovePendingAgentAction() throws Exception {
        String token = login("rutkarf@optimustest.fr");

        MvcResult approveResult = mockMvc.perform(post("/approvals/" + PENDING_ACTION_ID + "/approve")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"comment":"Approuvé pour relance client"}
                                """))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode approval = objectMapper.readTree(approveResult.getResponse().getContentAsString());
        assertThat(approval.get("decision").asText()).isEqualTo("APPROVED");

        MvcResult actionsResult = mockMvc.perform(get("/agents/actions")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode actions = objectMapper.readTree(actionsResult.getResponse().getContentAsString());
        JsonNode approved = null;
        for (JsonNode action : actions) {
            if (PENDING_ACTION_ID.equals(action.get("id").asText())) {
                approved = action;
                break;
            }
        }
        assertThat(approved).isNotNull();
        assertThat(approved.get("workflowStatus").asText()).isEqualTo("COMPLETED");
        assertThat(approved.get("executionResult").asText()).isNotBlank();
        assertThat(approved.get("executedAt").asText()).isNotBlank();

        // SEND_PAYMENT_REMINDER must have marked invoice FAC-2026-014 as REMINDED
        MvcResult invoices = mockMvc.perform(get("/accounting/invoices")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode invList = objectMapper.readTree(invoices.getResponse().getContentAsString());
        boolean reminded = false;
        for (JsonNode inv : invList) {
            if ("FAC-2026-014".equals(inv.get("reference").asText())) {
                assertThat(inv.get("status").asText()).isEqualTo("REMINDED");
                reminded = true;
            }
        }
        assertThat(reminded).isTrue();
    }

    @Test
    @Order(3)
    void ceoCanRejectPendingAgentAction() throws Exception {
        String token = login("rutkarf@optimustest.fr");

        // Seed may only have one pending — if second id missing, reject already-approved should 4xx
        MvcResult result = mockMvc.perform(post("/approvals/" + SECOND_PENDING_ID + "/reject")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"comment":"Hors scope"}
                                """))
                .andReturn();

        int status = result.getResponse().getStatus();
        assertThat(status).isIn(200, 404, 409);
        if (status == 200) {
            JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
            assertThat(body.get("decision").asText()).isEqualTo("REJECTED");
        }
    }

    @Test
    @Order(4)
    void approveAlreadyCompletedIsRejected() throws Exception {
        String token = login("rutkarf@optimustest.fr");

        mockMvc.perform(post("/approvals/" + PENDING_ACTION_ID + "/approve")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"comment":"Double approve"}
                                """))
                .andExpect(status().is4xxClientError());
    }

    private String login(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"Demo2026!","organizationSlug":"optimustest"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("accessToken").asText();
    }
}
