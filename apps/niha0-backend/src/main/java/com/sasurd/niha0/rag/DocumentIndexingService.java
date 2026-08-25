package com.sasurd.niha0.rag;

import com.sasurd.niha0.organization.CompanyDataAsset;
import com.sasurd.niha0.organization.CompanyDataAssetRepository;
import com.sasurd.niha0.storage.ObjectStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Indexes uploaded text-like documents into searchable chunks.
 */
@Service
public class DocumentIndexingService {

    private static final Logger log = LoggerFactory.getLogger(DocumentIndexingService.class);
    private static final int CHUNK_SIZE = 900;
    private static final int CHUNK_OVERLAP = 120;
    private static final Set<String> INDEXABLE = Set.of(
            "text/plain", "text/csv", "text/markdown", "application/json",
            "application/xml", "text/xml", "text/html"
    );

    private final DocumentChunkRepository chunkRepository;
    private final CompanyDataAssetRepository dataAssetRepository;
    private final ObjectStorageService objectStorage;
    private final EmbeddingProvider embeddingProvider;

    public DocumentIndexingService(DocumentChunkRepository chunkRepository,
                                   CompanyDataAssetRepository dataAssetRepository,
                                   ObjectStorageService objectStorage,
                                   EmbeddingProvider embeddingProvider) {
        this.chunkRepository = chunkRepository;
        this.dataAssetRepository = dataAssetRepository;
        this.objectStorage = objectStorage;
        this.embeddingProvider = embeddingProvider;
    }

    @Transactional
    public int indexAsset(CompanyDataAsset asset, String storageKey, String contentType, byte[] bytes) {
        if (asset == null || asset.getId() == null) return 0;
        UUID orgId = asset.getOrganizationId();
        chunkRepository.deleteByOrganizationIdAndDataAssetId(orgId, asset.getId());

        String mime = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
        if (!isIndexable(mime, asset.getFileType())) {
            asset.setProcessingStatus("UPLOADED");
            dataAssetRepository.save(asset);
            return 0;
        }

        String text = extractText(bytes, mime);
        if (text == null || text.isBlank()) {
            asset.setProcessingStatus("UPLOADED");
            dataAssetRepository.save(asset);
            return 0;
        }

        List<String> parts = chunk(text);
        int i = 0;
        for (String part : parts) {
            DocumentChunk chunk = new DocumentChunk();
            chunk.setOrganizationId(orgId);
            chunk.setDataAssetId(asset.getId());
            chunk.setStoredAssetId(asset.getStoredAssetId());
            chunk.setChunkIndex(i++);
            chunk.setContent(part);
            chunk.setTokenEstimate(Math.max(1, part.length() / 4));
            chunk.setEmbeddingJson(EmbeddingJson.toJson(embeddingProvider.embed(part)));
            chunkRepository.save(chunk);
        }

        asset.setProcessingStatus(parts.isEmpty() ? "UPLOADED" : "INDEXED");
        asset.setStatus(parts.isEmpty() ? "IMPORTED" : "INDEXED");
        dataAssetRepository.save(asset);
        log.info("Indexed {} chunks for asset {}", parts.size(), asset.getId());
        return parts.size();
    }

    @Transactional
    public int reindexFromStorage(CompanyDataAsset asset, String storageKey, String contentType) {
        try (InputStream in = objectStorage.open(storageKey)) {
            byte[] bytes = in.readAllBytes();
            return indexAsset(asset, storageKey, contentType, bytes);
        } catch (Exception e) {
            log.warn("Reindex failed for {}: {}", asset.getId(), e.getMessage());
            return 0;
        }
    }

    public static boolean isIndexable(String mime, String fileType) {
        if (mime != null && (INDEXABLE.contains(mime) || mime.startsWith("text/"))) return true;
        if (fileType == null) return false;
        String ft = fileType.toUpperCase(Locale.ROOT);
        return Set.of("TXT", "CSV", "JSON", "MD", "XML", "HTML").contains(ft);
    }

    private static String extractText(byte[] bytes, String mime) {
        String raw = new String(bytes, StandardCharsets.UTF_8);
        if (mime != null && mime.contains("json")) {
            return raw.replaceAll("[{}\\[\\]\",]", " ").replaceAll("\\s+", " ").trim();
        }
        if (mime != null && mime.contains("html")) {
            return raw.replaceAll("(?is)<script.*?>.*?</script>", " ")
                    .replaceAll("(?is)<style.*?>.*?</style>", " ")
                    .replaceAll("<[^>]+>", " ")
                    .replaceAll("\\s+", " ")
                    .trim();
        }
        return raw.trim();
    }

    static List<String> chunk(String text) {
        List<String> out = new ArrayList<>();
        if (text.length() <= CHUNK_SIZE) {
            out.add(text);
            return out;
        }
        int start = 0;
        while (start < text.length()) {
            int end = Math.min(text.length(), start + CHUNK_SIZE);
            if (end < text.length()) {
                int space = text.lastIndexOf(' ', end);
                if (space > start + CHUNK_SIZE / 2) end = space;
            }
            out.add(text.substring(start, end).trim());
            if (end >= text.length()) break;
            start = Math.max(start + 1, end - CHUNK_OVERLAP);
        }
        return out.stream().filter(s -> !s.isBlank()).toList();
    }
}
