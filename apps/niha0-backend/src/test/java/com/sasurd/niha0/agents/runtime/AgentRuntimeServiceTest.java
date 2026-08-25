package com.sasurd.niha0.agents.runtime;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AgentRuntimeServiceTest {

    @Test
    void detectsHitlFromGraphName() {
        assertThat(AgentRuntimeService.needsHumanApproval("demo-hitl", null)).isTrue();
        assertThat(AgentRuntimeService.needsHumanApproval("default", null)).isFalse();
    }

    @Test
    void detectsHumanNodeInGraphJson() {
        String json = "{\"nodes\":[{\"id\":\"a\",\"type\":\"start\"},{\"id\":\"h\",\"type\":\"human\"}]}";
        assertThat(AgentRuntimeService.needsHumanApproval("default", json)).isTrue();
        assertThat(AgentRuntimeService.needsHumanApproval("default", "{\"nodes\":[]}")).isFalse();
    }
}
