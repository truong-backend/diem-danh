package com.example.diem_danh.controller;

import com.example.diem_danh.dto.request.LoginRequest;
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

    /**
     * Logout: blacklist access token vào Redis + xóa refresh token khỏi DB.
     * Client gửi: { "refreshToken": "...", "accessToken": "..." }
     * accessToken là tùy chọn nhưng khuyến khích gửi để invalidate ngay.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        // Lấy access token từ body hoặc Authorization header
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
}
