package com.sasurd.niha0.identity;

import com.sasurd.niha0.config.AppProperties;
import com.sasurd.niha0.config.MailProperties;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "niha0.mail.mode", havingValue = "smtp")
public class SmtpMailService implements MailService {

    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;
    private final AppProperties appProperties;
    private final MailTemplateRenderer templates;

    public SmtpMailService(JavaMailSender mailSender,
                           MailProperties mailProperties,
                           AppProperties appProperties,
                           MailTemplateRenderer templates) {
        this.mailSender = mailSender;
        this.mailProperties = mailProperties;
        this.appProperties = appProperties;
        this.templates = templates;
    }

    @Override
    public void sendPasswordResetToken(String email, UUID token) {
        String actionUrl = appProperties.getPublicUrl() + "/reset-password?token=" + token;
        String html = templates.render("password-reset", Map.of(
                "email", email,
                "actionUrl", actionUrl));
        send(email, "Réinitialisez votre mot de passe NIHAO", html,
                templates.plainFallback("Réinitialisez votre mot de passe NIHAO", actionUrl));
    }

    @Override
    public void sendOrganizationInvite(String email, UUID token) {
        String actionUrl = appProperties.getPublicUrl() + "/accept-invite?token=" + token;
        String html = templates.render("organization-invite", Map.of(
                "email", email,
                "actionUrl", actionUrl));
        send(email, "Invitation à rejoindre NIHAO", html,
                templates.plainFallback("Vous êtes invité·e sur NIHAO", actionUrl));
    }

    private void send(String to, String subject, String html, String plain) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailProperties.getFrom());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(plain, html);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new IllegalStateException("Failed to send mail to " + to, e);
        }
    }
}
