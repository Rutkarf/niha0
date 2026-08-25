package com.sasurd.niha0.chat;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/chat")
@PreAuthorize("isAuthenticated() and hasAuthority('chat.use')")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/threads")
    public ChatThread createThread(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> payload = body == null ? Map.of() : body;
        String title = payload.get("title") != null ? payload.get("title").toString() : "Conversation";
        UUID agentId = null;
        if (payload.get("agentId") != null && !payload.get("agentId").toString().isBlank()) {
            agentId = UUID.fromString(payload.get("agentId").toString());
        }
        return chatService.createThread(title, agentId);
    }

    @GetMapping("/threads")
    public List<ChatThread> listThreads() {
        return chatService.listThreads();
    }

    @GetMapping("/threads/{id}/messages")
    public List<ChatMessage> listMessages(@PathVariable UUID id) {
        return chatService.listMessages(id);
    }

    @PostMapping("/threads/{id}/messages")
    public Map<String, Object> postMessage(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return chatService.postMessage(id, body == null ? null : body.get("content"));
    }
}
