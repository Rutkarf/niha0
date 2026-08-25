package com.sasurd.niha0.notifications;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<Notification> list() {
        return notificationService.listForCurrentUser();
    }

    @PatchMapping("/{id}/read")
    public Notification markRead(@PathVariable UUID id) {
        return notificationService.markRead(id);
    }
}
