package com.sasurd.niha0.storage;

import com.sasurd.niha0.common.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.InputStream;
import java.net.URI;
import java.time.Duration;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

/**
 * S3-compatible storage for MinIO ({@code niha0.storage.mode=minio}) and AWS S3 ({@code s3}).
 */
@Service
@ConditionalOnExpression("'${niha0.storage.mode:local}'.equals('minio') || '${niha0.storage.mode:local}'.equals('s3')")
public class S3CompatibleObjectStorageService implements ObjectStorageService {

    private static final Logger log = LoggerFactory.getLogger(S3CompatibleObjectStorageService.class);

    private final S3Client s3;
    private final S3Presigner presigner;
    private final String bucket;
    private final Duration defaultTtl;

    public S3CompatibleObjectStorageService(
            @Value("${niha0.storage.mode:local}") String mode,
            @Value("${niha0.storage.s3.endpoint:}") String endpoint,
            @Value("${niha0.storage.s3.region:us-east-1}") String region,
            @Value("${niha0.storage.s3.access-key:}") String accessKey,
            @Value("${niha0.storage.s3.secret-key:}") String secretKey,
            @Value("${niha0.storage.s3.bucket:niha0}") String bucket,
            @Value("${niha0.storage.s3.path-style:true}") boolean pathStyle,
            @Value("${niha0.storage.s3.signed-url-ttl-seconds:300}") long signedUrlTtlSeconds) {
        if (accessKey.isBlank() || secretKey.isBlank()) {
            throw new IllegalStateException(
                    "niha0.storage.s3.access-key and secret-key are required for mode=" + mode);
        }
        this.bucket = bucket;
        this.defaultTtl = Duration.ofSeconds(Math.max(30, signedUrlTtlSeconds));

        boolean usePathStyle = pathStyle || "minio".equalsIgnoreCase(mode);
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);
        S3Configuration s3Config = S3Configuration.builder()
                .pathStyleAccessEnabled(usePathStyle)
                .build();

        var clientBuilder = S3Client.builder()
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .region(Region.of(region))
                .serviceConfiguration(s3Config);
        var presignerBuilder = S3Presigner.builder()
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .region(Region.of(region))
                .serviceConfiguration(s3Config);

        if (endpoint != null && !endpoint.isBlank()) {
            URI uri = URI.create(endpoint);
            clientBuilder.endpointOverride(uri);
            presignerBuilder.endpointOverride(uri);
        }

        this.s3 = clientBuilder.build();
        this.presigner = presignerBuilder.build();
        ensureBucket();
        log.info("S3-compatible object storage ready (mode={}, bucket={}, endpoint={})",
                mode, bucket, endpoint == null || endpoint.isBlank() ? "aws-default" : endpoint);
    }

    private void ensureBucket() {
        try {
            s3.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
        } catch (NoSuchBucketException e) {
            s3.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
            log.info("Created object storage bucket '{}'", bucket);
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                s3.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
                log.info("Created object storage bucket '{}'", bucket);
            } else {
                throw new IllegalStateException("Cannot access storage bucket '" + bucket + "': " + e.getMessage(), e);
            }
        }
    }

    @Override
    public StoredObject put(UUID organizationId, String kind, String originalFilename,
                            String contentType, InputStream data, long sizeBytes) {
        String safeName = sanitizeFilename(originalFilename);
        String key = organizationId + "/" + kind + "/" + UUID.randomUUID() + "_" + safeName;
        try {
            long length = sizeBytes > 0 ? sizeBytes : Math.max(0, data.available());
            PutObjectRequest.Builder req = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(contentType)
                    .contentLength(length);
            s3.putObject(req.build(), RequestBody.fromInputStream(data, length));
            return new StoredObject(key, length, contentType);
        } catch (Exception e) {
            throw new ApiException(500, "Failed to write object to S3 storage");
        }
    }

    @Override
    public InputStream open(String storageKey) {
        try {
            return s3.getObject(GetObjectRequest.builder().bucket(bucket).key(storageKey).build());
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                throw new ApiException(404, "Stored object not found");
            }
            throw new ApiException(500, "Failed to read object from S3 storage");
        }
    }

    @Override
    public void delete(String storageKey) {
        try {
            s3.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(storageKey).build());
        } catch (S3Exception e) {
            throw new ApiException(500, "Failed to delete stored object");
        }
    }

    @Override
    public boolean isLocalDevOnly() {
        return false;
    }

    @Override
    public boolean supportsSignedUrls() {
        return true;
    }

    @Override
    public Optional<SignedUrl> createSignedGetUrl(String storageKey, Duration ttl) {
        Duration effective = ttl == null || ttl.isZero() || ttl.isNegative() ? defaultTtl : ttl;
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(storageKey)
                .build();
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(effective)
                .getObjectRequest(getObjectRequest)
                .build();
        PresignedGetObjectRequest presigned = presigner.presignGetObject(presignRequest);
        return Optional.of(new SignedUrl(presigned.url().toString(), effective.toSeconds()));
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
