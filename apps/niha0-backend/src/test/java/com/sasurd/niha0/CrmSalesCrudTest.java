package com.sasurd.niha0;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CrmSalesCrudTest {

    @Autowired
    MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void ownerCanCrudLeadAndOpportunity() throws Exception {
        String token = login();

        MvcResult leadCreate = mockMvc.perform(post("/crm/leads")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"companyName":"Acme SA","contactName":"Ada","status":"NEW","score":70,"source":"TEST"}
                                """))
                .andExpect(status().isOk())
                .andReturn();
        String leadId = objectMapper.readTree(leadCreate.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(put("/crm/leads/" + leadId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"companyName":"Acme SA","contactName":"Ada","status":"QUALIFIED","score":90,"source":"TEST"}
                                """))
                .andExpect(status().isOk());

        MvcResult oppCreate = mockMvc.perform(post("/crm/opportunities")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Deal Acme","stage":"QUALIFICATION","amount":12000,"probability":20}
                                """))
                .andExpect(status().isOk())
                .andReturn();
        String oppId = objectMapper.readTree(oppCreate.getResponse().getContentAsString()).get("id").asText();

        MvcResult oppUpdate = mockMvc.perform(put("/crm/opportunities/" + oppId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Deal Acme","stage":"PROPOSAL","amount":12000,"probability":40}
                                """))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(objectMapper.readTree(oppUpdate.getResponse().getContentAsString())
                .get("stage").asText()).isEqualTo("PROPOSAL");

        mockMvc.perform(delete("/crm/opportunities/" + oppId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mockMvc.perform(delete("/crm/leads/" + leadId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/agents/engine").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
                    assertThat(body.get("demo").asBoolean()).isTrue();
                    assertThat(body.get("label").asText()).containsIgnoringCase("mock");
                });
    }

    private String login() throws Exception {
        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"rutkarf@optimustest.fr","password":"Demo2026!","organizationSlug":"optimustest"}
                                """))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("accessToken").asText();
    }
}
