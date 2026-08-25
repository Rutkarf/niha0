package com.sasurd.niha0;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RagIndexingTest {

    @Autowired
    MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void textUploadIsIndexedAndSearchable() throws Exception {
        String token = login();
        String body = """
                Rapport OptimusTest — facture FAC-2026-014 en retard.
                Client Maison Dupont, relance commerciale prévue.
                """;
        MockMultipartFile file = new MockMultipartFile(
                "file", "rapport.txt", "text/plain", body.getBytes());

        MvcResult upload = mockMvc.perform(
                        multipart("/organizations/current/data-assets/upload")
                                .file(file)
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode asset = objectMapper.readTree(upload.getResponse().getContentAsString());
        assertThat(asset.get("processingStatus").asText()).isEqualTo("INDEXED");

        MvcResult search = mockMvc.perform(get("/rag/search")
                        .param("q", "facture Dupont")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode result = objectMapper.readTree(search.getResponse().getContentAsString());
        assertThat(result.get("totalChunks").asInt()).isGreaterThan(0);
        assertThat(result.get("engine").asText()).isEqualTo("hash-embedding-demo");
        assertThat(result.get("hits").isArray()).isTrue();
        assertThat(result.get("hits").size()).isGreaterThan(0);
    }

    @Test
    void ragStatsExposeEmbeddingProvider() throws Exception {
        String token = login();
        MvcResult stats = mockMvc.perform(get("/rag/stats")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode result = objectMapper.readTree(stats.getResponse().getContentAsString());
        assertThat(result.get("embeddingProvider").asText()).isEqualTo("hash");
        assertThat(result.get("demo").asBoolean()).isTrue();
        assertThat(result.get("engine").asText()).isEqualTo("hash-embedding-demo");
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
