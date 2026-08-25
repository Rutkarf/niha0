package com.sasurd.niha0.identity;

import java.util.UUID;

public interface MailService {

    void sendPasswordResetToken(String email, UUID token);

    void sendOrganizationInvite(String email, UUID token);
}
