package com.sasurd.niha0.agents.provider;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ModelProviderRegistry {

    private final String configuredProvider;
    private final MockLlmProvider mockLlmProvider;
    private final OpenAiCompatibleLlmProvider openAiCompatibleLlmProvider;

    public ModelProviderRegistry(
            @Value("${niha0.ai.provider:mock}") String configuredProvider,
            MockLlmProvider mockLlmProvider,
            OpenAiCompatibleLlmProvider openAiCompatibleLlmProvider) {
        this.configuredProvider = configuredProvider == null ? "mock" : configuredProvider.trim().toLowerCase();
        this.mockLlmProvider = mockLlmProvider;
        this.openAiCompatibleLlmProvider = openAiCompatibleLlmProvider;
    }

    public LlmProvider resolve() {
        if ("openai".equals(configuredProvider)) {
            return openAiCompatibleLlmProvider;
        }
        return mockLlmProvider;
    }

    public String currentProviderName() {
        return resolve().name();
    }
}
