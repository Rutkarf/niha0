package com.sasurd.niha0.governance;

import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class ToolSandboxService {

    private static final Set<String> ALLOWLIST = Set.of("recommend", "search", "memory_write", "chat");

    private final ToolSandboxLogRepository logRepository;

    public ToolSandboxService(ToolSandboxLogRepository logRepository) {
        this.logRepository = logRepository;
    }

    @Transactional
    public void execute(String toolName, Runnable action) {
        String name = toolName == null ? "" : toolName.trim().toLowerCase(Locale.ROOT);
        long start = System.currentTimeMillis();
        boolean allowed = ALLOWLIST.contains(name);
        String detail;
        if (!allowed) {
            detail = "Tool not in allowlist";
            saveLog(name, false, (int) (System.currentTimeMillis() - start), detail);
            throw new ApiException(403, "Tool not allowed: " + toolName);
        }
        try {
            // Simulated sandbox timeout budget (tools must finish quickly in demo).
            action.run();
            long elapsed = System.currentTimeMillis() - start;
            if (elapsed > 5_000) {
                detail = "Exceeded simulated timeout";
                saveLog(name, false, (int) elapsed, detail);
                throw new ApiException(408, "Tool sandbox timeout");
            }
            saveLog(name, true, (int) elapsed, "OK");
        } catch (ApiException e) {
            throw e;
        } catch (RuntimeException e) {
            saveLog(name, false, (int) (System.currentTimeMillis() - start), e.getMessage());
            throw e;
        }
    }

    private void saveLog(String toolName, boolean allowed, int durationMs, String detail) {
        ToolSandboxLog log = new ToolSandboxLog();
        log.setOrganizationId(SecurityUtils.requireOrganizationId());
        log.setToolName(toolName == null || toolName.isBlank() ? "unknown" : toolName);
        log.setAllowed(allowed);
        log.setDurationMs(Math.max(0, durationMs));
        log.setDetail(detail);
        log.setCreatedBy(SecurityUtils.currentUserId());
        logRepository.save(log);
    }
}
