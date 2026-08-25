package com.sasurd.niha0.agents;

import java.util.Map;

/**
 * Result of applying an approved agent action to domain entities.
 */
public record ActionExecutionResult(
        boolean applied,
        String summary,
        Map<String, Object> details
) {
    public static ActionExecutionResult skipped(String reason) {
        return new ActionExecutionResult(false, reason, Map.of("status", "skipped"));
    }

    public static ActionExecutionResult ok(String summary, Map<String, Object> details) {
        return new ActionExecutionResult(true, summary, details);
    }
}
