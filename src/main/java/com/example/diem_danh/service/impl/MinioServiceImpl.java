package com.example.diem_danh.service.impl;

import com.example.diem_danh.service.MinioService;
import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MinioServiceImpl implements MinioService {

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucket;

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${app.minio.public-url:${minio.endpoint}}")
    private String publicUrl;

    @Override
    public String uploadFile(String folder, MultipartFile file) throws Exception {
        ensureBucketExists();

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String objectName = folder + "/" + UUID.randomUUID() + extension;

        minioClient.putObject(
                PutObjectArgs.builder()
                        .bucket(bucket)
                        .object(objectName)
                        .stream(file.getInputStream(), file.getSize(), -1)
                        .contentType(file.getContentType())
                        .build()
        );

        String url = publicUrl.replaceAll("/$", "") + "/" + bucket + "/" + objectName;
        log.info("File uploaded: {} → {}", objectName, url);
        return url;
    }

    @Override
    public void deleteFile(String objectName) throws Exception {
        minioClient.removeObject(
                RemoveObjectArgs.builder()
                        .bucket(bucket)
                        .object(objectName)
                        .build()
        );
    }

    private void ensureBucketExists() throws Exception {
        boolean exists = minioClient.bucketExists(
                BucketExistsArgs.builder().bucket(bucket).build());
        if (!exists) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            log.info("Created MinIO bucket: {}", bucket);
        }
        // Set bucket policy = public read-only cho phép browser load ảnh trực tiếp
        // mà không cần presigned URL
        setBucketPublicReadPolicy();
    }

    /**
     * Set S3-compatible bucket policy để cho phép anonymous GET object.
     * Cần thiết vì Nginx proxy /minio/ → MinIO không forward Authorization header,
     * nên MinIO phải được config public-read mới trả file cho browser.
     */
    private void setBucketPublicReadPolicy() {
        String policy = "{"
                + "\"Version\":\"2012-10-17\","
                + "\"Statement\":[{"
                + "\"Effect\":\"Allow\","
                + "\"Principal\":{\"AWS\":[\"*\"]},"
                + "\"Action\":[\"s3:GetObject\"],"
                + "\"Resource\":[\"arn:aws:s3:::" + bucket + "/*\"]"
                + "}]}";
        try {
            minioClient.setBucketPolicy(
                    SetBucketPolicyArgs.builder()
                            .bucket(bucket)
                            .config(policy)
                            .build()
            );
            log.debug("Bucket policy set to public-read for: {}", bucket);
        } catch (Exception e) {
            // Log warning nhưng không throw — policy có thể đã được set trước đó
            log.warn("Could not set bucket policy for {}: {}", bucket, e.getMessage());
        }
    }
}