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
class Nihao05OsLayersTest {

    @Autowired
    MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void osLayersSeedAndApisWork() throws Exception {
        String token = login();

        MvcResult products = mockMvc.perform(get("/pim/products")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(objectMapper.readTree(products.getResponse().getContentAsString()).size())
                .isGreaterThanOrEqualTo(2);

        mockMvc.perform(post("/agents/runtime/start")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"graphName":"default"}
                                """))
                .andExpect(status().isOk());

        MvcResult runs = mockMvc.perform(get("/agents/runtime")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(objectMapper.readTree(runs.getResponse().getContentAsString()).size())
                .isGreaterThanOrEqualTo(1);

        MvcResult threadResult = mockMvc.perform(post("/chat/threads")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"NIHAO_05 test"}
                                """))
                .andExpect(status().isOk())
                .andReturn();
        String threadId = objectMapper.readTree(threadResult.getResponse().getContentAsString())
                .get("id").asText();

        mockMvc.perform(post("/chat/threads/" + threadId + "/messages")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content":"Bonjour assistant NIHAO"}
                                """))
                .andExpect(status().isOk());

        MvcResult permissions = mockMvc.perform(get("/governance/permissions/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(objectMapper.readTree(permissions.getResponse().getContentAsString()).size())
                .isGreaterThanOrEqualTo(1);

        MvcResult listings = mockMvc.perform(get("/marketplace/listings")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(objectMapper.readTree(listings.getResponse().getContentAsString()).size())
                .isGreaterThanOrEqualTo(1);

        mockMvc.perform(post("/memory")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"scope":"SESSION","keyName":"demo","content":"hello-session"}
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(get("/bi/report")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        MvcResult hitl = mockMvc.perform(post("/agents/runtime/start")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"graphName":"demo-hitl"}
                                """))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode hitlRun = objectMapper.readTree(hitl.getResponse().getContentAsString());
        assertThat(hitlRun.get("status").asText()).isEqualTo("INTERRUPTED");

        mockMvc.perform(post("/agents/runtime/" + hitlRun.get("id").asText() + "/resume")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"decision":"APPROVED"}
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/erp/cms/items")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"home","title":"Page accueil","status":"DRAFT","detailsJson":"{\\"note\\":\\"hello\\"}"}
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(get("/erp/cms/items")
                        .header("Authorization", "Bearer " + token))
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
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return body.get("accessToken").asText();
    }
}
