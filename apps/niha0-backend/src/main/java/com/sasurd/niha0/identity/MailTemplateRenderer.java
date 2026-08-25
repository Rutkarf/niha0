package com.sasurd.niha0.identity;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Minimal HTML mail templates loaded from classpath (no Thymeleaf dependency).
 */
@Component
public class MailTemplateRenderer {

    public String render(String templateName, Map<String, String> vars) {
        String html = load("mail/" + templateName + ".html");
        for (Map.Entry<String, String> entry : vars.entrySet()) {
            html = html.replace("{{" + entry.getKey() + "}}", entry.getValue() == null ? "" : entry.getValue());
        }
        return html;
    }

    public String plainFallback(String title, String actionUrl) {
        return title + "\n\n" + actionUrl + "\n\n— NIHAO";
    }

    private String load(String classpath) {
        try {
            ClassPathResource resource = new ClassPathResource(classpath);
            return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Missing mail template: " + classpath, e);
        }
    }
}
