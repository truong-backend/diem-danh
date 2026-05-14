package com.example.diem_danh.service;

import com.example.diem_danh.dto.request.ForgotPasswordRequest;
import com.example.diem_danh.dto.request.LoginRequest;
import com.example.diem_danh.dto.request.ResetPasswordRequest;
import com.example.diem_danh.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse refresh(String refreshToken);
    /** @param accessToken nếu có, sẽ được thêm vào Redis blacklist ngay lập tức */
    void logout(String refreshToken, String accessToken);
    /** Gửi email chứa link reset password (token lưu Redis, TTL 15 phút) */
    void forgotPassword(ForgotPasswordRequest request);
    /** Xác thực token và đặt mật khẩu mới */
    void resetPassword(ResetPasswordRequest request);
}