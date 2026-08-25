package com.sasurd.niha0;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
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
class TenancyIsolationTest {

    @Autowired
    MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void usersOnlySeeTheirOrganizationData() throws Exception {
        String novaToken = login("rutkarf@optimustest.fr", "optimustest");
        String rivalToken = login("ceo@tenant-isolation.fr", "tenant-isolation");

        MvcResult novaCustomers = mockMvc.perform(get("/crm/customers")
                        .header("Authorization", "Bearer " + novaToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode novaList = objectMapper.readTree(novaCustomers.getResponse().getContentAsString());
        assertThat(novaList).hasSize(2);
        assertThat(novaList.get(0).get("name").asText()).doesNotContain("Rival Secret");

        MvcResult rivalCustomers = mockMvc.perform(get("/crm/customers")
                        .header("Authorization", "Bearer " + rivalToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode rivalList = objectMapper.readTree(rivalCustomers.getResponse().getContentAsString());
        assertThat(rivalList).hasSize(1);
        assertThat(rivalList.get(0).get("name").asText()).isEqualTo("Client Rival Secret");
    }

    private String login(String email, String orgSlug) throws Exception {
        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"Demo2026!","organizationSlug":"%s"}
                                """.formatted(email, orgSlug)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("accessToken").asText();
    }
}
