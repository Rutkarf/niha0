package com.sasurd.niha0.rag;

import com.sasurd.niha0.organization.CompanyDataAsset;
import com.sasurd.niha0.organization.CompanyDataAssetRepository;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Hybrid RAG: vector similarity when embeddings exist, keyword fallback otherwise.
 */
@Service
public class RagService {

    public static final String ENGINE_KEYWORD = "keyword-rag";
    public static final String ENGINE_HYBRID = "hybrid-rag";
    public static final String ENGINE_HASH_DEMO = "hash-embedding-demo";

    private final DocumentChunkRepository chunkRepository;
    private final CompanyDataAssetRepository dataAssetRepository;
    private final EmbeddingProvider embeddingProvider;

    public RagService(DocumentChunkRepository chunkRepository,
                      CompanyDataAssetRepository dataAssetRepository,
                      EmbeddingProvider embeddingProvider) {
        this.chunkRepository = chunkRepository;
        this.dataAssetRepository = dataAssetRepository;
        this.embeddingProvider = embeddingProvider;
    }

    public boolean hasDemoEmbeddings() {
        return embeddingProvider.isDemo();
    }

    public String embeddingProviderName() {
        return embeddingProvider.isDemo() ? "hash" : "openai";
    }

    @Transactional(readOnly = true)
    public RagSearchResponse search(String query, int limit) {
        UUID orgId = SecurityUtils.requireOrganizationId();
        String q = query == null ? "" : query.trim();
        int max = Math.min(20, Math.max(1, limit));
        List<DocumentChunk> chunks = chunkRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId);
        if (q.isBlank() || chunks.isEmpty()) {
            return new RagSearchResponse(q, chunks.size(), ENGINE_KEYWORD, List.of());
        }

        Map<UUID, String> names = dataAssetRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                .collect(Collectors.toMap(CompanyDataAsset::getId, CompanyDataAsset::getName, (a, b) -> a));

        boolean vectorAvailable = chunks.stream().anyMatch(c -> c.getEmbeddingJson() != null && !c.getEmbeddingJson().isBlank());
        if (vectorAvailable) {
            RagSearchResponse vectorResult = vectorSearch(q, chunks, names, max);
            if (!vectorResult.hits().isEmpty()) {
                return vectorResult;
            }
        }
        return keywordSearch(q, chunks, names, max);
    }

    @Transactional(readOnly = true)
    public String contextForAgent(String agentCode, int maxChars) {
        UUID orgId = SecurityUtils.requireOrganizationId();
        List<DocumentChunk> chunks = chunkRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId);
        if (chunks.isEmpty()) return "";

        String query = agentCode == null ? "" : agentCode.trim();
        boolean vectorAvailable = chunks.stream().anyMatch(c -> c.getEmbeddingJson() != null && !c.getEmbeddingJson().isBlank());
        if (vectorAvailable && !query.isBlank()) {
            Map<UUID, String> names = dataAssetRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                    .collect(Collectors.toMap(CompanyDataAsset::getId, CompanyDataAsset::getName, (a, b) -> a));
            List<RagHit> hits = vectorSearch(query, chunks, names, 5).hits();
            StringBuilder sb = new StringBuilder();
            for (RagHit hit : hits) {
                if (sb.length() + hit.excerpt().length() > maxChars) break;
                if (!sb.isEmpty()) sb.append("\n---\n");
                sb.append(hit.excerpt());
            }
            if (!sb.isEmpty()) return sb.toString();
        }

        String needle = query.toLowerCase(Locale.ROOT);
        StringBuilder sb = new StringBuilder();
        for (DocumentChunk chunk : chunks) {
            String c = chunk.getContent();
            if (!needle.isBlank() && !c.toLowerCase(Locale.ROOT).contains(needle)
                    && !c.toLowerCase(Locale.ROOT).contains("entreprise")
                    && !c.toLowerCase(Locale.ROOT).contains("client")) {
                continue;
            }
            if (sb.length() + c.length() > maxChars) break;
            if (!sb.isEmpty()) sb.append("\n---\n");
            sb.append(c);
        }
        if (sb.isEmpty()) {
            for (DocumentChunk chunk : chunks) {
                if (sb.length() + chunk.getContent().length() > maxChars) break;
                if (!sb.isEmpty()) sb.append("\n---\n");
                sb.append(chunk.getContent());
            }
        }
        return sb.toString();
    }

    private RagSearchResponse vectorSearch(String q, List<DocumentChunk> chunks,
                                           Map<UUID, String> names, int max) {
        float[] queryVector = embeddingProvider.embed(q);
        String engine = embeddingProvider.isDemo() ? ENGINE_HASH_DEMO : ENGINE_HYBRID;
        List<RagHit> scored = new ArrayList<>();
        for (DocumentChunk chunk : chunks) {
            float[] chunkVector = EmbeddingJson.fromJson(chunk.getEmbeddingJson());
            if (chunkVector == null) continue;
            double score = cosineSimilarity(queryVector, chunkVector);
            if (score <= 0) continue;
            String name = names.getOrDefault(chunk.getDataAssetId(), "document");
            scored.add(new RagHit(
                    chunk.getId(),
                    chunk.getDataAssetId(),
                    name,
                    chunk.getChunkIndex(),
                    excerpt(chunk.getContent(), 280),
                    Math.round(score * 1000.0) / 1000.0));
        }
        scored.sort(Comparator.comparingDouble(RagHit::score).reversed());
        if (scored.size() > max) {
            scored = scored.subList(0, max);
        }
        return new RagSearchResponse(q, chunks.size(), engine, List.copyOf(scored));
    }

    private RagSearchResponse keywordSearch(String q, List<DocumentChunk> chunks,
                                            Map<UUID, String> names, int max) {
        Set<String> terms = tokenize(q);
        List<RagHit> scored = new ArrayList<>();
        for (DocumentChunk chunk : chunks) {
            double score = score(chunk.getContent(), terms, q.toLowerCase(Locale.ROOT));
            if (score <= 0) continue;
            String name = names.getOrDefault(chunk.getDataAssetId(), "document");
            scored.add(new RagHit(
                    chunk.getId(),
                    chunk.getDataAssetId(),
                    name,
                    chunk.getChunkIndex(),
                    excerpt(chunk.getContent(), 280),
                    Math.round(score * 1000.0) / 1000.0));
        }
        scored.sort(Comparator.comparingDouble(RagHit::score).reversed());
        if (scored.size() > max) {
            scored = scored.subList(0, max);
        }
        return new RagSearchResponse(q, chunks.size(), ENGINE_KEYWORD, List.copyOf(scored));
    }

    private static double cosineSimilarity(float[] a, float[] b) {
        if (a == null || b == null || a.length == 0 || a.length != b.length) return 0;
        double dot = 0;
        double normA = 0;
        double normB = 0;
        for (int i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        if (normA <= 0 || normB <= 0) return 0;
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private static Set<String> tokenize(String q) {
        return Arrays.stream(q.toLowerCase(Locale.ROOT).split("[^\\p{L}\\p{N}]+"))
                .filter(t -> t.length() > 2)
                .collect(Collectors.toCollection(HashSet::new));
    }

    private static double score(String content, Set<String> terms, String fullQuery) {
        String lower = content.toLowerCase(Locale.ROOT);
        double s = 0;
        if (lower.contains(fullQuery) && fullQuery.length() > 3) s += 5;
        for (String t : terms) {
            int idx = 0;
            int count = 0;
            while ((idx = lower.indexOf(t, idx)) >= 0) {
                count++;
                idx += t.length();
            }
            s += count;
        }
        return s;
    }

    private static String excerpt(String content, int max) {
        if (content.length() <= max) return content;
        return content.substring(0, max - 1) + "…";
    }
}
