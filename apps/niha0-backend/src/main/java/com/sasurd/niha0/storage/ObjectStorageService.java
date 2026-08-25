package com.sasurd.niha0.storage;

import java.io.InputStream;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

/**
 * Abstraction over binary object storage (local / MinIO / S3).
 * Database stores metadata only — never large payloads long-term.
 */
public interface ObjectStorageService {

    record StoredObject(String storageKey, long sizeBytes, String contentType) {}

    record SignedUrl(String url, long expiresInSeconds) {}

    StoredObject put(UUID organizationId, String kind, String originalFilename,
                     String contentType, InputStream data, long sizeBytes);

    InputStream open(String storageKey);

    void delete(String storageKey);

    /** True when this backend is unsuitable for production (e.g. local disk). */
    boolean isLocalDevOnly();

    /**
     * Optional pre-signed GET URL (S3/MinIO). Local mode returns empty —
     * clients must use authenticated streaming via StorageController.
     */
    default Optional<SignedUrl> createSignedGetUrl(String storageKey, Duration ttl) {
        return Optional.empty();
    }

    default boolean supportsSignedUrls() {
        return false;
    }
}
