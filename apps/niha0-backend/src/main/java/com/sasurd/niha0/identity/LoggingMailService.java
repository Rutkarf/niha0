package com.sasurd.niha0.identity;

import com.sasurd.niha0.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@ConditionalOnProperty(name = "niha0.mail.mode", havingValue = "log", matchIfMissing = true)
public class LoggingMailService implements MailService {

    private static final Logger log = LoggerFactory.getLogger(LoggingMailService.class);

    private final AppProperties appProperties;

    public LoggingMailService(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @Override
    public void sendPasswordResetToken(String email, UUID token) {
        log.info("Password reset link for {}: {}/reset-password?token={}",
                email, appProperties.getPublicUrl(), token);
    }

    @Override
    public void sendOrganizationInvite(String email, UUID token) {
        log.info("Organization invite link for {}: {}/accept-invite?token={}",
                email, appProperties.getPublicUrl(), token);
    }
}
