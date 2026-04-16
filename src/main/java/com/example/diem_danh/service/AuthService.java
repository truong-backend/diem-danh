package com.example.diem_danh.service;

import com.example.diem_danh.dto.request.LoginRequest;
import com.example.diem_danh.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse refresh(String refreshToken);
    /** @param accessToken nếu có, sẽ được thêm vào Redis blacklist ngay lập tức */
    void logout(String refreshToken, String accessToken);
}
