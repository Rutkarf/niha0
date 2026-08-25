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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HrStockLegalModulesTest {

    @Autowired
    MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void hrStockLegalSeedAndCrudWork() throws Exception {
        String token = login();

        MvcResult employees = mockMvc.perform(get("/hr/employees")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(objectMapper.readTree(employees.getResponse().getContentAsString()).size()).isGreaterThanOrEqualTo(2);

        MvcResult stock = mockMvc.perform(get("/stock/items")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode items = objectMapper.readTree(stock.getResponse().getContentAsString());
        assertThat(items.size()).isGreaterThanOrEqualTo(2);

        String sku42Id = null;
        int qtyBefore = 0;
        for (JsonNode item : items) {
            if ("SKU-42".equals(item.get("sku").asText())) {
                sku42Id = item.get("id").asText();
                qtyBefore = item.get("quantity").asInt();
            }
        }
        assertThat(sku42Id).isNotBlank();

        MvcResult adjusted = mockMvc.perform(post("/stock/items/" + sku42Id + "/adjust")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"movementType":"PURCHASE","quantity":5,"note":"test"}
                                """))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(objectMapper.readTree(adjusted.getResponse().getContentAsString())
                .get("quantity").asInt()).isEqualTo(qtyBefore + 5);

        MvcResult contracts = mockMvc.perform(get("/legal/contracts")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(objectMapper.readTree(contracts.getResponse().getContentAsString()).size()).isGreaterThanOrEqualTo(2);

        MvcResult leaves = mockMvc.perform(get("/hr/leaves")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode leaveList = objectMapper.readTree(leaves.getResponse().getContentAsString());
        assertThat(leaveList.size()).isGreaterThanOrEqualTo(1);
        String leaveId = leaveList.get(0).get("id").asText();

        mockMvc.perform(post("/hr/leaves/" + leaveId + "/decide")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"APPROVED"}
                                """))
                .andExpect(status().isOk());
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
