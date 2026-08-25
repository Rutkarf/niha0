package com.sasurd.niha0;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sasurd.niha0.common.Role;
import com.sasurd.niha0.organization.Membership;
import com.sasurd.niha0.organization.MembershipRepository;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PlatformAdminTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    MembershipRepository membershipRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void ownerForbiddenOnPlatformEndpoints() throws Exception {
        String email = "owner-plat-" + UUID.randomUUID() + "@example.test";
        String access = register(email, "Owner Corp " + UUID.randomUUID().toString().substring(0, 6));

        mockMvc.perform(get("/platform/organizations")
                        .header("Authorization", "Bearer " + access))
                .andExpect(status().isForbidden());
    }

    @Test
    void platformAdminCanSuspendAndLoginIsBlocked() throws Exception {
        String victimEmail = "victim-" + UUID.randomUUID() + "@example.test";
        String victimCompany = "Victim Co " + UUID.randomUUID().toString().substring(0, 6);
        JsonNode victimTokens = registerRaw(victimEmail, victimCompany);
        String victimAccess = victimTokens.get("accessToken").asText();
        String orgId = victimTokens.get("organizationId").asText();

        String adminEmail = "padmin-" + UUID.randomUUID() + "@example.test";
        JsonNode adminTokens = registerRaw(adminEmail, "Ops Desk " + UUID.randomUUID().toString().substring(0, 6));
        UUID adminUserId = UUID.fromString(adminTokens.get("userId").asText());
        promoteToPlatformAdmin(adminUserId);
        String adminAccess = login(adminEmail);

        mockMvc.perform(get("/platform/organizations")
                        .header("Authorization", "Bearer " + adminAccess))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").exists());

        mockMvc.perform(post("/platform/organizations/" + orgId + "/suspend")
                        .header("Authorization", "Bearer " + adminAccess))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"Demo2026!"}
                                """.formatted(victimEmail)))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/platform/organizations/" + orgId + "/unsuspend")
                        .header("Authorization", "Bearer " + adminAccess))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"Demo2026!"}
                                """.formatted(victimEmail)))
                .andExpect(status().isOk());

        // victim access token from before suspend still works for /auth/me but login is gated
        mockMvc.perform(get("/auth/me").header("Authorization", "Bearer " + victimAccess))
                .andExpect(status().isOk());
    }

    private void promoteToPlatformAdmin(UUID userId) {
        Membership membership = membershipRepository.findByUserIdAndActiveTrue(userId).stream()
                .findFirst()
                .orElseThrow();
        membership.setRole(Role.PLATFORM_ADMIN);
        membershipRepository.save(membership);
    }

    private String register(String email, String company) throws Exception {
        return registerRaw(email, company).get("accessToken").asText();
    }

    private JsonNode registerRaw(String email, String company) throws Exception {
        MvcResult register = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"%s",
                                  "password":"Demo2026!",
                                  "firstName":"Pat",
                                  "lastName":"Admin",
                                  "companyName":"%s",
                                  "sector":"Ops"
                                }
                                """.formatted(email, company)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode tokens = objectMapper.readTree(register.getResponse().getContentAsString());
        assertThat(tokens.get("accessToken").asText()).isNotBlank();
        return tokens;
    }

    private String login(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"Demo2026!"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }
}
