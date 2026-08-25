package com.sasurd.niha0.agents.runtime;

import com.sasurd.niha0.agents.provider.ModelProviderRegistry;
import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.marketplace.AgentDefinition;
import com.sasurd.niha0.marketplace.AgentDefinitionRepository;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class AgentRuntimeService {

    private final AgentRuntimeRunRepository runRepository;
    private final AgentRuntimeStepRepository stepRepository;
    private final ModelProviderRegistry modelProviderRegistry;
    private final AgentDefinitionRepository definitionRepository;

    public AgentRuntimeService(AgentRuntimeRunRepository runRepository,
                               AgentRuntimeStepRepository stepRepository,
                               ModelProviderRegistry modelProviderRegistry,
                               AgentDefinitionRepository definitionRepository) {
        this.runRepository = runRepository;
        this.stepRepository = stepRepository;
        this.modelProviderRegistry = modelProviderRegistry;
        this.definitionRepository = definitionRepository;
    }

    @Transactional
    public AgentRuntimeRun startRun(UUID agentId, String graphName) {
        UUID orgId = orgId();
        String graph = (graphName == null || graphName.isBlank()) ? "default" : graphName.trim();
        AgentDefinition definition = definitionRepository
                .findFirstByOrganizationIdAndSlugOrderByVersionDesc(orgId, graph)
                .orElse(null);
        String graphJson = definition != null ? definition.getGraphJson() : null;
        boolean needsHuman = needsHumanApproval(graph, graphJson);

        AgentRuntimeRun run = new AgentRuntimeRun();
        run.setOrganizationId(orgId);
        run.setAgentId(agentId);
        run.setGraphName(graph);
        run.setStatus("RUNNING");
        run.setCurrentNode("plan");
        run.setStateJson("{\"phase\":\"start\",\"definitionId\":"
                + (definition == null ? "null" : "\"" + definition.getId() + "\"")
                + "}");
        run.setModelProvider(modelProviderRegistry.currentProviderName());
        run.setCreatedBy(SecurityUtils.currentUserId());
        run = runRepository.save(run);

        int index = 0;
        addStep(run, "plan", index++, "{\"goal\":\"plan\"}", "{\"plan\":[\"analyze\",\"act\"]}", "DONE");
        addStep(run, "tool", index++, "{\"tool\":\"recommend\"}", "{\"result\":\"ok\"}", "DONE");

        if (needsHuman) {
            addStep(run, "decide", index, "{\"needsHuman\":true}", "{\"decision\":\"PENDING_HUMAN\"}", "WAITING");
            run.setCurrentNode("decide");
            run.setStatus("INTERRUPTED");
            run.setInterruptReason("Human approval required");
            run.setStateJson("{\"phase\":\"decide\",\"needsHuman\":true}");
        } else {
            addStep(run, "decide", index++, "{\"needsHuman\":false}", "{\"decision\":\"AUTO_APPROVE\"}", "DONE");
            addStep(run, "complete", index, "{}", "{\"status\":\"COMPLETED\"}", "DONE");
            run.setCurrentNode("complete");
            run.setStatus("COMPLETED");
            run.setInterruptReason(null);
            run.setStateJson("{\"phase\":\"complete\"}");
        }
        return runRepository.save(run);
    }

    @Transactional
    public AgentRuntimeRun resumeRun(UUID runId, String decision) {
        AgentRuntimeRun run = getRun(runId);
        if (!"INTERRUPTED".equals(run.getStatus())) {
            throw new ApiException(409, "Run is not interrupted");
        }
        String normalized = decision == null || decision.isBlank() ? "APPROVED" : decision.trim().toUpperCase(Locale.ROOT);
        int nextIndex = stepRepository.findByOrganizationIdAndRunIdOrderByStepIndexAsc(orgId(), runId).size();

        addStep(run, "decide", nextIndex++,
                "{\"resume\":true}",
                "{\"decision\":\"" + normalized + "\"}",
                "DONE");
        addStep(run, "complete", nextIndex, "{}", "{\"status\":\"COMPLETED\",\"decision\":\"" + normalized + "\"}", "DONE");

        run.setCurrentNode("complete");
        run.setStatus("COMPLETED");
        run.setInterruptReason(null);
        run.setStateJson("{\"phase\":\"complete\",\"decision\":\"" + normalized + "\"}");
        return runRepository.save(run);
    }

    @Transactional(readOnly = true)
    public List<AgentRuntimeRun> listRuns() {
        return runRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId());
    }

    @Transactional(readOnly = true)
    public AgentRuntimeRun getRun(UUID id) {
        return runRepository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Runtime run not found"));
    }

    @Transactional(readOnly = true)
    public List<AgentRuntimeStep> listSteps(UUID runId) {
        getRun(runId);
        return stepRepository.findByOrganizationIdAndRunIdOrderByStepIndexAsc(orgId(), runId);
    }

    static boolean needsHumanApproval(String graphName, String graphJson) {
        String name = graphName == null ? "" : graphName.toLowerCase(Locale.ROOT);
        if (name.contains("hitl") || name.contains("human")) {
            return true;
        }
        if (graphJson == null || graphJson.isBlank()) {
            return false;
        }
        String lower = graphJson.toLowerCase(Locale.ROOT);
        return lower.contains("\"type\":\"human\"")
                || lower.contains("\"type\": \"human\"")
                || lower.contains("\"type\":\"hitl\"")
                || lower.contains("\"type\": \"hitl\"")
                || lower.contains("\"needsHuman\":true")
                || lower.contains("\"needsHuman\": true");
    }

    private void addStep(AgentRuntimeRun run, String node, int index, String input, String output, String status) {
        AgentRuntimeStep step = new AgentRuntimeStep();
        step.setOrganizationId(run.getOrganizationId());
        step.setRunId(run.getId());
        step.setNodeName(node);
        step.setStepIndex(index);
        step.setInputJson(input);
        step.setOutputJson(output);
        step.setStatus(status);
        step.setLatencyMs(5 + index);
        stepRepository.save(step);
    }

    private UUID orgId() {
        return SecurityUtils.requireOrganizationId();
    }
}
