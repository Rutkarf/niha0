package com.sasurd.niha0.governance;

import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class GuardrailService {

    private static final Pattern EMAIL = Pattern.compile(
            "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
    private static final Pattern CREDIT_CARD = Pattern.compile(
            "\\b(?:\\d[ -]*?){13,19}\\b");

    private final GuardrailEventRepository eventRepository;

    public GuardrailService(GuardrailEventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public record ScanResult(boolean blocked, String reason, GuardrailEvent event) {}

    @Transactional
    public ScanResult scanText(String text) {
        String value = text == null ? "" : text;
        boolean blocked = false;
        String reason = "OK";
        String eventType = "SCAN";
        String severity = "INFO";

        if (value.toUpperCase(Locale.ROOT).contains("FORBIDDEN_PROMPT")) {
            blocked = true;
            reason = "FORBIDDEN_PROMPT detected";
            eventType = "PROMPT_INJECTION";
            severity = "HIGH";
        } else if (value.contains("BLOCK_PII:") || EMAIL.matcher(value).find() || looksLikeCard(value)) {
            blocked = true;
            reason = "PII pattern detected";
            eventType = "PII";
            severity = "HIGH";
        }

        GuardrailEvent event = new GuardrailEvent();
        event.setOrganizationId(SecurityUtils.requireOrganizationId());
        event.setEventType(eventType);
        event.setSeverity(severity);
        event.setSource("guardrail.scan");
        event.setDetail(reason + " | sample=" + truncate(value, 160));
        event.setBlocked(blocked);
        event.setCreatedBy(SecurityUtils.currentUserId());
        event = eventRepository.save(event);

        return new ScanResult(blocked, reason, event);
    }

    private static boolean looksLikeCard(String value) {
        return CREDIT_CARD.matcher(value).find()
                && value.replaceAll("[^0-9]", "").length() >= 13;
    }

    private static String truncate(String value, int max) {
        if (value.length() <= max) {
            return value;
        }
        return value.substring(0, max) + "…";
    }
}
