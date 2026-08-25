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
class StorageUploadTest {

    @Autowired
    MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void ownerCanUploadAndDownloadDocument() throws Exception {
        String token = login("rutkarf@optimustest.fr");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "note.txt",
                "text/plain",
                "hello nihao".getBytes());

        MvcResult upload = mockMvc.perform(
                        multipart("/organizations/current/data-assets/upload")
                                .file(file)
                                .param("category", "import")
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = objectMapper.readTree(upload.getResponse().getContentAsString());
        assertThat(body.get("processingStatus").asText()).isIn("UPLOADED", "INDEXED");
        String storedAssetId = body.get("storedAssetId").asText();
        assertThat(storedAssetId).isNotBlank();

        mockMvc.perform(get("/storage/assets/" + storedAssetId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void signedUrlEndpointReportsUnsupportedInLocalMode() throws Exception {
        String token = login("rutkarf@optimustest.fr");

        MockMultipartFile file = new MockMultipartFile(
                "file", "note.txt", "text/plain", "hello".getBytes());
        MvcResult upload = mockMvc.perform(
                        multipart("/organizations/current/data-assets/upload")
                                .file(file)
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        String storedAssetId = objectMapper.readTree(upload.getResponse().getContentAsString())
                .get("storedAssetId").asText();

        MvcResult signed = mockMvc.perform(get("/storage/assets/" + storedAssetId + "/signed-url")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode body = objectMapper.readTree(signed.getResponse().getContentAsString());
        assertThat(body.get("supported").asBoolean()).isFalse();
        assertThat(body.get("streamPath").asText()).contains("/storage/assets/");
    }

    @Test
    void unauthenticatedDownloadIsRejected() throws Exception {
        mockMvc.perform(get("/storage/assets/00000000-0000-0000-0000-000000000099"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void salesUserCannotUploadDocuments() throws Exception {
        String token = login("sales@optimustest.fr");
        MockMultipartFile file = new MockMultipartFile(
                "file", "note.txt", "text/plain", "x".getBytes());
        mockMvc.perform(
                        multipart("/organizations/current/data-assets/upload")
                                .file(file)
                                .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
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
