package com.example.diem_danh.service;

import org.springframework.web.multipart.MultipartFile;

public interface MinioService {
    /**
     * Upload file lên MinIO, trả về URL public để truy cập.
     */
    String uploadFile(String folder, MultipartFile file) throws Exception;

    /**
     * Xóa file trên MinIO theo object name (path trong bucket).
     */
    void deleteFile(String objectName) throws Exception;
}