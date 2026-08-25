package com.sasurd.niha0.governance;

import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Service
public class EvalService {

    private final AgentEvalMetricRepository metricRepository;

    public EvalService(AgentEvalMetricRepository metricRepository) {
        this.metricRepository = metricRepository;
    }

    @Transactional
    public AgentEvalMetric recordRecommendation() {
        return bump(m -> m.setRecommendations(m.getRecommendations() + 1));
    }

    @Transactional
    public AgentEvalMetric recordApproval() {
        return bump(m -> m.setApprovals(m.getApprovals() + 1));
    }

    @Transactional
    public AgentEvalMetric recordRejection() {
        return bump(m -> m.setRejections(m.getRejections() + 1));
    }

    @Transactional
    public AgentEvalMetric recordEscalation() {
        return bump(m -> m.setEscalations(m.getEscalations() + 1));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboard() {
        AgentEvalMetric today = todayMetric(false);
        if (today == null) {
            return Map.of(
                    "metricDate", LocalDate.now().toString(),
                    "recommendations", 0,
                    "approvals", 0,
                    "rejections", 0,
                    "escalations", 0,
                    "avgLatencyMs", 0,
                    "estimatedCostCents", 0
            );
        }
        return Map.of(
                "metricDate", today.getMetricDate().toString(),
                "recommendations", today.getRecommendations(),
                "approvals", today.getApprovals(),
                "rejections", today.getRejections(),
                "escalations", today.getEscalations(),
                "avgLatencyMs", today.getAvgLatencyMs(),
                "estimatedCostCents", today.getEstimatedCostCents()
        );
    }

    private AgentEvalMetric bump(java.util.function.Consumer<AgentEvalMetric> mutator) {
        AgentEvalMetric metric = todayMetric(true);
        mutator.accept(metric);
        return metricRepository.save(metric);
    }

    private AgentEvalMetric todayMetric(boolean create) {
        UUID orgId = SecurityUtils.requireOrganizationId();
        LocalDate today = LocalDate.now();
        return metricRepository.findByOrganizationIdAndMetricDate(orgId, today)
                .orElseGet(() -> {
                    if (!create) {
                        return null;
                    }
                    AgentEvalMetric metric = new AgentEvalMetric();
                    metric.setOrganizationId(orgId);
                    metric.setMetricDate(today);
                    return metricRepository.save(metric);
                });
    }
}
