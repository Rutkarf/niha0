package com.sasurd.niha0.storage;

import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.InputStream;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/storage")
public class StorageController {

    private final StoredAssetRepository storedAssetRepository;
    private final ObjectStorageService objectStorage;

    public StorageController(StoredAssetRepository storedAssetRepository,
                             ObjectStorageService objectStorage) {
        this.storedAssetRepository = storedAssetRepository;
        this.objectStorage = objectStorage;
    }

    /** Secure download — tenant-scoped, streams from object storage. */
    @GetMapping("/assets/{id}")
    public ResponseEntity<InputStreamResource> download(@PathVariable UUID id) {
        StoredAsset asset = requireAsset(id);

        InputStream stream = objectStorage.open(asset.getStorageKey());
        String filename = asset.getOriginalFilename() == null ? "file" : asset.getOriginalFilename();
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        try {
            mediaType = MediaType.parseMediaType(asset.getContentType());
        } catch (Exception ignored) {
            /* keep octet-stream */
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename.replace("\"", "") + "\"")
                .contentType(mediaType)
                .contentLength(Math.max(0, asset.getSizeBytes()))
                .body(new InputStreamResource(stream));
    }

    /**
     * Returns a short-lived signed GET URL when the storage backend supports it (MinIO/S3).
     * Local mode returns {@code supported=false} so clients fall back to authenticated streaming.
     */
    @GetMapping("/assets/{id}/signed-url")
    public Map<String, Object> signedUrl(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "300") long ttlSeconds) {
        StoredAsset asset = requireAsset(id);
        long ttl = Math.min(3600, Math.max(30, ttlSeconds));
        return objectStorage.createSignedGetUrl(asset.getStorageKey(), Duration.ofSeconds(ttl))
                .map(signed -> Map.<String, Object>of(
                        "supported", true,
                        "url", signed.url(),
                        "expiresInSeconds", signed.expiresInSeconds(),
                        "filename", asset.getOriginalFilename() == null ? "file" : asset.getOriginalFilename()))
                .orElseGet(() -> Map.of(
                        "supported", false,
                        "streamPath", "/storage/assets/" + id,
                        "message", "Signed URLs unavailable; use authenticated streaming download"));
    }

    private StoredAsset requireAsset(UUID id) {
        UUID orgId = SecurityUtils.requireOrganizationId();
        return storedAssetRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ApiException(404, "Asset not found"));
    }
}
