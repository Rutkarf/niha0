package com.sasurd.niha0.rag;

import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/rag")
public class RagController {

    private final RagService ragService;
    private final DocumentChunkRepository chunkRepository;

    public RagController(RagService ragService, DocumentChunkRepository chunkRepository) {
        this.ragService = ragService;
        this.chunkRepository = chunkRepository;
    }

    @GetMapping("/search")
    public RagSearchResponse search(
            @RequestParam String q,
            @RequestParam(defaultValue = "8") int limit) {
        return ragService.search(q, limit);
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        var orgId = SecurityUtils.requireOrganizationId();
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("chunkCount", chunkRepository.countByOrganizationId(orgId));
        stats.put("embeddingProvider", ragService.embeddingProviderName());
        stats.put("demo", ragService.hasDemoEmbeddings());
        stats.put("engine", ragService.hasDemoEmbeddings()
                ? RagService.ENGINE_HASH_DEMO
                : RagService.ENGINE_HYBRID);
        return stats;
    }
}
