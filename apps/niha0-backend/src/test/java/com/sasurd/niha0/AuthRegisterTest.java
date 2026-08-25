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

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthRegisterTest {

    @Autowired
    MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void registerCreatesOrganizationAndOwnerThenMeWorks() throws Exception {
        String email = "owner-" + UUID.randomUUID() + "@example.test";
        String company = "Acme " + UUID.randomUUID().toString().substring(0, 8);

        MvcResult register = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"%s",
                                  "password":"Demo2026!",
                                  "firstName":"Ada",
                                  "lastName":"Lovelace",
                                  "companyName":"%s",
                                  "sector":"Tech"
                                }
                                """.formatted(email, company)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode tokens = objectMapper.readTree(register.getResponse().getContentAsString());
        assertThat(tokens.get("accessToken").asText()).isNotBlank();
        assertThat(tokens.get("refreshToken").asText()).isNotBlank();
        assertThat(tokens.get("organizationId").asText()).isNotBlank();
        assertThat(tokens.get("role").asText()).isEqualTo("OWNER");

        String access = tokens.get("accessToken").asText();

        MvcResult me = mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + access))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode user = objectMapper.readTree(me.getResponse().getContentAsString());
        assertThat(user.get("email").asText()).isEqualTo(email);
        assertThat(user.get("firstName").asText()).isEqualTo("Ada");
        assertThat(user.get("organizationName").asText()).isEqualTo(company);

        MvcResult org = mockMvc.perform(get("/organizations/current")
                        .header("Authorization", "Bearer " + access))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode organization = objectMapper.readTree(org.getResponse().getContentAsString());
        assertThat(organization.get("name").asText()).isEqualTo(company);
        assertThat(organization.get("onboardingStatus").asText()).isIn("IN_PROGRESS", "NOT_STARTED");
    }

    @Test
    void refreshRotatesTokens() throws Exception {
        String email = "refresh-" + UUID.randomUUID() + "@example.test";

        MvcResult register = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"%s",
                                  "password":"Demo2026!",
                                  "firstName":"Grace",
                                  "lastName":"Hopper",
                                  "companyName":"Navy Labs",
                                  "sector":"Defense"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode tokens = objectMapper.readTree(register.getResponse().getContentAsString());
        String refresh = tokens.get("refreshToken").asText();

        MvcResult refreshed = mockMvc.perform(post("/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"refreshToken":"%s"}
                                """.formatted(refresh)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode next = objectMapper.readTree(refreshed.getResponse().getContentAsString());
        assertThat(next.get("accessToken").asText()).isNotBlank();
        assertThat(next.get("refreshToken").asText()).isNotBlank();
        assertThat(next.get("refreshToken").asText()).isNotEqualTo(refresh);

        // Old refresh token must be revoked
        mockMvc.perform(post("/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"refreshToken":"%s"}
                                """.formatted(refresh)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void duplicateEmailReturnsConflict() throws Exception {
        String email = "dup-" + UUID.randomUUID() + "@example.test";
        String body = """
                {
                  "email":"%s",
                  "password":"Demo2026!",
                  "firstName":"A",
                  "lastName":"B",
                  "companyName":"Dup Co",
                  "sector":"Services"
                }
                """.formatted(email);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict());
    }
}
