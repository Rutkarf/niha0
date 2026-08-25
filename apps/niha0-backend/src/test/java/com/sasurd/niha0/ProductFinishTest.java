package com.sasurd.niha0;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sasurd.niha0.identity.PasswordResetToken;
import com.sasurd.niha0.identity.PasswordResetTokenRepository;
import com.sasurd.niha0.identity.User;
import com.sasurd.niha0.identity.UserRepository;
import com.sasurd.niha0.security.TotpService;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ProductFinishTest {

    private static String ownerToken;
    private static String ownerEmail;
    private static String inviteeEmail;
    private static UUID inviteToken;
    private static UUID memberMembershipId;

    @Autowired
    MockMvc mockMvc;

    @Autowired
    PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    TotpService totpService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @Order(1)
    void registerOwnerForProductFlows() throws Exception {
        ownerEmail = "owner-" + UUID.randomUUID() + "@example.test";
        inviteeEmail = "invitee-" + UUID.randomUUID() + "@example.test";

        MvcResult register = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"%s",
                                  "password":"Demo2026!",
                                  "firstName":"Owner",
                                  "lastName":"Test",
                                  "companyName":"Product Finish Co",
                                  "sector":"Tech"
                                }
                                """.formatted(ownerEmail)))
                .andExpect(status().isOk())
                .andReturn();

        ownerToken = objectMapper.readTree(register.getResponse().getContentAsString())
                .get("accessToken").asText();
        assertThat(ownerToken).isNotBlank();
    }

    @Test
    @Order(2)
    void forgotAndResetPasswordRoundtrip() throws Exception {
        mockMvc.perform(post("/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s"}
                                """.formatted(ownerEmail)))
                .andExpect(status().isOk());

        User user = userRepository.findByEmailIgnoreCase(ownerEmail).orElseThrow();
        UUID userId = user.getId();
        PasswordResetToken resetToken = passwordResetTokenRepository.findAll().stream()
                .filter(t -> t.getUserId().equals(userId))
                .filter(t -> t.getUsedAt() == null)
                .findFirst()
                .orElseThrow();

        mockMvc.perform(post("/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s","newPassword":"NewPass2026!"}
                                """.formatted(resetToken.getToken())))
                .andExpect(status().isOk());

        user = userRepository.findById(user.getId()).orElseThrow();
        assertThat(passwordEncoder.matches("NewPass2026!", user.getPasswordHash())).isTrue();

        MvcResult login = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"NewPass2026!"}
                                """.formatted(ownerEmail)))
                .andExpect(status().isOk())
                .andReturn();

        ownerToken = objectMapper.readTree(login.getResponse().getContentAsString())
                .get("accessToken").asText();
    }

    @Test
    @Order(3)
    void inviteAcceptCreatesMember() throws Exception {
        mockMvc.perform(post("/organizations/invites")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","role":"MEMBER"}
                                """.formatted(inviteeEmail)))
                .andExpect(status().isOk());

        MvcResult invites = mockMvc.perform(get("/organizations/invites")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode invite = objectMapper.readTree(invites.getResponse().getContentAsString()).get(0);
        inviteToken = UUID.fromString(invite.get("token").asText());

        MvcResult accept = mockMvc.perform(post("/auth/accept-invite")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "token":"%s",
                                  "password":"Invite2026!",
                                  "firstName":"Invited",
                                  "lastName":"Member"
                                }
                                """.formatted(inviteToken)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode tokens = objectMapper.readTree(accept.getResponse().getContentAsString());
        assertThat(tokens.get("accessToken").asText()).isNotBlank();
        assertThat(tokens.get("role").asText()).isEqualTo("MEMBER");
    }

    @Test
    @Order(4)
    void memberRoleUpdateWorks() throws Exception {
        MvcResult members = mockMvc.perform(get("/organizations/members")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode membersJson = objectMapper.readTree(members.getResponse().getContentAsString());
        JsonNode member = null;
        for (JsonNode node : membersJson) {
            if (inviteeEmail.equalsIgnoreCase(node.get("email").asText())) {
                member = node;
                break;
            }
        }
        assertThat(member).isNotNull();
        memberMembershipId = UUID.fromString(member.get("id").asText());

        MvcResult updated = mockMvc.perform(patch("/organizations/members/" + memberMembershipId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"role":"ADMIN"}
                                """))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(objectMapper.readTree(updated.getResponse().getContentAsString())
                .get("role").asText()).isEqualTo("ADMIN");
    }

    @Test
    @Order(5)
    void feedbackSubmissionStoresEntry() throws Exception {
        MvcResult feedback = mockMvc.perform(post("/feedback")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"category":"UX","message":"Great workspace!"}
                                """))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = objectMapper.readTree(feedback.getResponse().getContentAsString());
        assertThat(body.get("id").asText()).isNotBlank();
        assertThat(body.get("category").asText()).isEqualTo("UX");
    }

    @Test
    @Order(6)
    void billingPlanGetReturnsFreeDefaults() throws Exception {
        MvcResult plan = mockMvc.perform(get("/billing/plan")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = objectMapper.readTree(plan.getResponse().getContentAsString());
        assertThat(body.get("plan").asText()).isEqualTo("FREE");
        assertThat(body.get("seatsUsed").asInt()).isGreaterThanOrEqualTo(1);
        assertThat(body.get("seatsLimit").asInt()).isEqualTo(3);
        assertThat(body.get("storageLimitBytes").asLong()).isGreaterThan(0);
        assertThat(body.get("aiActionsLimitDaily").asInt()).isEqualTo(20);
        assertThat(body.get("storageNote").asText()).contains("Stockage");
    }

    @Test
    @Order(7)
    void stubCheckoutUpgradesPlan() throws Exception {
        MvcResult checkout = mockMvc.perform(post("/billing/checkouts")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"plan":"PRO"}
                                """))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = objectMapper.readTree(checkout.getResponse().getContentAsString());
        String reference = body.get("checkoutReference").asText();
        assertThat(body.get("hostedCheckoutUrl").asText()).contains("billing=stub");

        mockMvc.perform(post("/billing/stub-complete")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"checkoutReference":"%s"}
                                """.formatted(reference)))
                .andExpect(status().isOk());

        MvcResult plan = mockMvc.perform(get("/billing/plan")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(objectMapper.readTree(plan.getResponse().getContentAsString())
                .get("plan").asText()).isEqualTo("PRO");
    }

    @Test
    @Order(8)
    void totpEnableAndConfirm() throws Exception {
        MvcResult enable = mockMvc.perform(post("/auth/mfa/enable")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode enableBody = objectMapper.readTree(enable.getResponse().getContentAsString());
        String secret = enableBody.get("secret").asText();
        assertThat(enableBody.get("otpauthUri").asText()).contains("otpauth://totp/NIHAO:");

        User user = userRepository.findByEmailIgnoreCase(ownerEmail).orElseThrow();
        String code = totpService.currentCode(secret);

        mockMvc.perform(post("/auth/mfa/confirm")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"%s"}
                                """.formatted(code)))
                .andExpect(status().isOk());

        user = userRepository.findById(user.getId()).orElseThrow();
        assertThat(user.isMfaEnabled()).isTrue();
        assertThat(user.getMfaRecoveryCodes()).isNotBlank();
    }
}
