package com.example.diem_danh.controller;

import com.example.diem_danh.dto.request.ForgotPasswordRequest;
import com.example.diem_danh.dto.request.LoginRequest;
import com.example.diem_danh.dto.request.ResetPasswordRequest;
import com.example.diem_danh.dto.response.ApiResponse;
import com.example.diem_danh.dto.response.AuthResponse;
import com.example.diem_danh.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(req)));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success(authService.refresh(body.get("refreshToken"))));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        String accessToken = body.get("accessToken");
        if (accessToken == null) {
            String header = request.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                accessToken = header.substring(7);
            }
        }
        authService.logout(body.get("refreshToken"), accessToken);
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest req) {
        authService.forgotPassword(req);
        return ResponseEntity.ok(ApiResponse.success(
                "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu.", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mật khẩu thành công.", null));
    }
}