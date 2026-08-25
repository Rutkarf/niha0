package com.sasurd.niha0.webhooks;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface WebhookDeliveryRepository extends JpaRepository<WebhookDelivery, UUID> {

    @Query("""
            SELECT d FROM WebhookDelivery d
            WHERE d.status = 'PENDING' AND d.nextAttemptAt <= :now
            ORDER BY d.nextAttemptAt ASC
            """)
    List<WebhookDelivery> findDuePending(Instant now);
}
