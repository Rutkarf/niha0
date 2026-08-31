package com.sasurd.niha0;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sasurd.niha0.common.Role;
import com.sasurd.niha0.identity.AuthService;
import com.sasurd.niha0.identity.SsoCodeService;
import com.sasurd.niha0.identity.dto.TokenResponse;
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
class OAuth2SsoTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    AuthService authService;

    @Autowired
    SsoCodeService ssoCodeService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void oauth2StatusDisabledByDefault() throws Exception {
        MvcResult result = mockMvc.perform(get("/auth/oauth2/status"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(body.get("enabled").asBoolean()).isFalse();
        assertThat(body.get("providers")).isEmpty();
        assertThat(body.get("demoMode").asBoolean()).isFalse();
    }

    @Test
    void ssoExchangeReturnsTokensAndAllowsMe() throws Exception {
        String email = "sso-" + UUID.randomUUID() + "@example.test";
        TokenResponse issued = authService.register(new com.sasurd.niha0.identity.dto.RegisterRequest(
                email,
                "Demo2026!",
                "Sso",
                "User",
                "Sso Org " + UUID.randomUUID().toString().substring(0, 8),
                "Services"));

        UUID code = ssoCodeService.createCode(issued);

        MvcResult exchange = mockMvc.perform(post("/auth/sso/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"%s"}
                                """.formatted(code)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode tokens = objectMapper.readTree(exchange.getResponse().getContentAsString());
        assertThat(tokens.get("accessToken").asText()).isNotBlank();
        assertThat(tokens.get("refreshToken").asText()).isNotBlank();
        assertThat(tokens.get("role").asText()).isEqualTo(Role.OWNER.name());

        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + tokens.get("accessToken").asText()))
                .andExpect(status().isOk());

        mockMvc.perform(post("/auth/sso/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"%s"}
                                """.formatted(code)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void authenticateOAuthUserLinksExistingEmail() {
        String email = "oauth-link-" + UUID.randomUUID() + "@example.test";
        authService.register(new com.sasurd.niha0.identity.dto.RegisterRequest(
                email,
                "Demo2026!",
                "Existing",
                "User",
                "Link Org " + UUID.randomUUID().toString().substring(0, 8),
                "Services"));

        TokenResponse oauth = authService.authenticateOAuthUser(
                "google",
                "google-sub-" + UUID.randomUUID(),
                email,
                "Existing",
                "User");

        assertThat(oauth.accessToken()).isNotBlank();
        assertThat(oauth.role()).isEqualTo(Role.OWNER);
    }
}
