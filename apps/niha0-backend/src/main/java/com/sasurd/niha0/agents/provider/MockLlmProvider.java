package com.sasurd.niha0.agents.provider;

import org.springframework.stereotype.Component;

@Component
public class MockLlmProvider implements LlmProvider {

    @Override
    public String complete(String system, String user) {
        String prompt = user == null ? "" : user.trim();
        if (prompt.isBlank()) {
            return "Je suis l'assistant NIHAO (mock). Comment puis-je vous aider ?";
        }
        String snippet = prompt.length() > 120 ? prompt.substring(0, 120) + "…" : prompt;
        return "[mock] Réponse NIHAO basée sur : " + snippet;
    }

    @Override
    public String name() {
        return "mock";
    }
}
