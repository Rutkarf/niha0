package com.sasurd.niha0.storage;

import com.sasurd.niha0.common.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;

/**
 * Local filesystem storage for development only.
 * Activate with niha0.storage.mode=local (default). Forbidden in prod by ProdSecurityValidator.
 */
@Service
@ConditionalOnProperty(name = "niha0.storage.mode", havingValue = "local", matchIfMissing = true)
public class LocalObjectStorageService implements ObjectStorageService {

    private final Path root;

    public LocalObjectStorageService(
            @Value("${niha0.storage.local-root:./data/object-storage}") String rootPath) {
        this.root = Path.of(rootPath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.root);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot create local object storage root: " + this.root, e);
        }
    }

    @Override
    public StoredObject put(UUID organizationId, String kind, String originalFilename,
                            String contentType, InputStream data, long sizeBytes) {
        String safeName = sanitizeFilename(originalFilename);
        String key = organizationId + "/" + kind + "/" + UUID.randomUUID() + "_" + safeName;
        Path target = root.resolve(key).normalize();
        if (!target.startsWith(root)) {
            throw new ApiException(400, "Invalid storage path");
        }
        try {
            Files.createDirectories(target.getParent());
            Files.copy(data, target, StandardCopyOption.REPLACE_EXISTING);
            long actual = Files.size(target);
            return new StoredObject(key, actual, contentType);
        } catch (IOException e) {
            throw new ApiException(500, "Failed to write object to local storage");
        }
    }

    @Override
    public InputStream open(String storageKey) {
        Path target = resolve(storageKey);
        try {
            return Files.newInputStream(target);
        } catch (IOException e) {
            throw new ApiException(404, "Stored object not found");
        }
    }

    @Override
    public void delete(String storageKey) {
        try {
            Files.deleteIfExists(resolve(storageKey));
        } catch (IOException e) {
            throw new ApiException(500, "Failed to delete stored object");
        }
    }

    @Override
    public boolean isLocalDevOnly() {
        return true;
    }

    private Path resolve(String storageKey) {
        if (storageKey == null || storageKey.isBlank() || storageKey.contains("..")) {
            throw new ApiException(400, "Invalid storage key");
        }
        Path target = root.resolve(storageKey).normalize();
        if (!target.startsWith(root)) {
            throw new ApiException(400, "Invalid storage key");
        }
        return target;
    }

    private static String sanitizeFilename(String name) {
        String base = name == null || name.isBlank() ? "file" : name;
        String cleaned = base.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (cleaned.length() > 120) {
            cleaned = cleaned.substring(cleaned.length() - 120);
        }
        return cleaned.toLowerCase(Locale.ROOT);
    }
}
