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

    // URL nội bộ để MinioClient kết nối upload
    @Value("${minio.endpoint}")
    private String endpoint;

    // URL public để browser có thể truy cập file (đặt trong env MINIO_PUBLIC_URL)
    // Nếu không có → fallback về endpoint
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

        // Dùng publicUrl thay vì endpoint — để browser có thể load ảnh trực tiếp
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
    }
}
