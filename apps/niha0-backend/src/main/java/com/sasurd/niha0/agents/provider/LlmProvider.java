package com.sasurd.niha0.agents.provider;

public interface LlmProvider {

    String complete(String system, String user);

    default String name() {
        return getClass().getSimpleName();
    }
}
