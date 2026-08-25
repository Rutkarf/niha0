package com.sasurd.niha0.chat;

import com.sasurd.niha0.agents.memory.AgentMemory;
import com.sasurd.niha0.agents.memory.AgentMemoryService;
import com.sasurd.niha0.agents.provider.ModelProviderRegistry;
import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.governance.GuardrailService;
import com.sasurd.niha0.rag.RagHit;
import com.sasurd.niha0.rag.RagSearchResponse;
import com.sasurd.niha0.rag.RagService;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final int RAG_HIT_LIMIT = 4;
    private static final int RAG_CONTEXT_CHARS = 2400;

    private final ChatThreadRepository threadRepository;
    private final ChatMessageRepository messageRepository;
    private final ModelProviderRegistry modelProviderRegistry;
    private final GuardrailService guardrailService;
    private final AgentMemoryService agentMemoryService;
    private final RagService ragService;

    public ChatService(ChatThreadRepository threadRepository,
                       ChatMessageRepository messageRepository,
                       ModelProviderRegistry modelProviderRegistry,
                       GuardrailService guardrailService,
                       AgentMemoryService agentMemoryService,
                       RagService ragService) {
        this.threadRepository = threadRepository;
        this.messageRepository = messageRepository;
        this.modelProviderRegistry = modelProviderRegistry;
        this.guardrailService = guardrailService;
        this.agentMemoryService = agentMemoryService;
        this.ragService = ragService;
    }

    @Transactional
    public ChatThread createThread(String title, UUID agentId) {
        ChatThread thread = new ChatThread();
        thread.setOrganizationId(orgId());
        thread.setTitle(title == null || title.isBlank() ? "Conversation" : title.trim());
        thread.setAgentId(agentId);
        thread.setCreatedBy(SecurityUtils.currentUserId());
        return threadRepository.save(thread);
    }

    @Transactional(readOnly = true)
    public List<ChatThread> listThreads() {
        return threadRepository.findByOrganizationIdOrderByUpdatedAtDesc(orgId());
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> listMessages(UUID threadId) {
        requireThread(threadId);
        return messageRepository.findByOrganizationIdAndThreadIdOrderByCreatedAtAsc(orgId(), threadId);
    }

    @Transactional
    public Map<String, Object> postMessage(UUID threadId, String content) {
        ChatThread thread = requireThread(threadId);
        if (content == null || content.isBlank()) {
            throw new ApiException(400, "content is required");
        }

        GuardrailService.ScanResult scan = guardrailService.scanText(content);
        if (scan.blocked()) {
            throw new ApiException(400, "Message blocked by guardrails: " + scan.reason());
        }

        UUID orgId = orgId();
        UUID userId = SecurityUtils.currentUserId();

        ChatMessage userMessage = new ChatMessage();
        userMessage.setOrganizationId(orgId);
        userMessage.setThreadId(threadId);
        userMessage.setRole("user");
        userMessage.setContent(content.trim());
        userMessage.setCreatedBy(userId);
        userMessage = messageRepository.save(userMessage);

        RagSearchResponse rag = ragService.search(content.trim(), RAG_HIT_LIMIT);
        String ragContext = buildRagContext(rag);
        boolean ragUsed = !rag.hits().isEmpty();
        String system = "Tu es l'assistant NIHAO pour l'entreprise. "
                + (ragUsed
                ? "Utilise le contexte documents suivant (RAG " + rag.engine() + "):\n" + ragContext
                : "Aucun extrait documentaire pertinent trouvé — réponds sans inventer de faits entreprise.");

        String reply = modelProviderRegistry.resolve().complete(system, content.trim());
        String provider = modelProviderRegistry.currentProviderName();

        String metadata = "{\"provider\":\"" + escapeJson(provider)
                + "\",\"rag\":" + ragUsed
                + ",\"ragEngine\":\"" + escapeJson(rag.engine())
                + "\",\"ragHits\":" + rag.hits().size()
                + ",\"demo\":" + ("mock".equalsIgnoreCase(provider) || ragService.hasDemoEmbeddings())
                + "}";

        ChatMessage assistantMessage = new ChatMessage();
        assistantMessage.setOrganizationId(orgId);
        assistantMessage.setThreadId(threadId);
        assistantMessage.setRole("assistant");
        assistantMessage.setContent(reply);
        assistantMessage.setMetadataJson(metadata);
        assistantMessage.setCreatedBy(userId);
        assistantMessage = messageRepository.save(assistantMessage);

        AgentMemory memory = new AgentMemory();
        memory.setScope("SESSION");
        memory.setScopeRef(threadId.toString());
        memory.setKeyName("last_user_message");
        memory.setContent(content.trim());
        memory.setMetadataJson("{\"threadId\":\"" + threadId + "\",\"ragHits\":" + rag.hits().size() + "}");
        agentMemoryService.put(memory);

        thread.setUpdatedAt(Instant.now());
        threadRepository.save(thread);

        return Map.of(
                "userMessage", userMessage,
                "assistantMessage", assistantMessage
        );
    }

    private String buildRagContext(RagSearchResponse rag) {
        if (rag.hits().isEmpty()) {
            return "";
        }
        String joined = rag.hits().stream()
                .map(this::formatHit)
                .collect(Collectors.joining("\n---\n"));
        if (joined.length() <= RAG_CONTEXT_CHARS) {
            return joined;
        }
        return joined.substring(0, RAG_CONTEXT_CHARS) + "…";
    }

    private String formatHit(RagHit hit) {
        String name = hit.assetName() == null || hit.assetName().isBlank() ? "document" : hit.assetName();
        return "[" + name + " #" + hit.chunkIndex() + "] " + hit.excerpt();
    }

    private static String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private ChatThread requireThread(UUID threadId) {
        return threadRepository.findByIdAndOrganizationId(threadId, orgId())
                .orElseThrow(() -> new ApiException(404, "Chat thread not found"));
    }

    private UUID orgId() {
        return SecurityUtils.requireOrganizationId();
    }
}
