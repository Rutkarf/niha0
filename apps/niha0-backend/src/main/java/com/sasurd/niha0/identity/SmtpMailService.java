package com.sasurd.niha0.identity;

import com.sasurd.niha0.config.AppProperties;
import com.sasurd.niha0.config.MailProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@ConditionalOnProperty(name = "niha0.mail.mode", havingValue = "smtp")
public class SmtpMailService implements MailService {

    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;
    private final AppProperties appProperties;

    public SmtpMailService(JavaMailSender mailSender,
                           MailProperties mailProperties,
                           AppProperties appProperties) {
        this.mailSender = mailSender;
        this.mailProperties = mailProperties;
        this.appProperties = appProperties;
    }

    @Override
    public void sendPasswordResetToken(String email, UUID token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailProperties.getFrom());
        message.setTo(email);
        message.setSubject("Reset your NIHAO password");
        message.setText("Reset your password: "
                + appProperties.getPublicUrl() + "/reset-password?token=" + token);
        mailSender.send(message);
    }

    @Override
    public void sendOrganizationInvite(String email, UUID token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailProperties.getFrom());
        message.setTo(email);
        message.setSubject("You are invited to NIHAO");
        message.setText("Accept your invite: "
                + appProperties.getPublicUrl() + "/accept-invite?token=" + token);
        mailSender.send(message);
    }
}
