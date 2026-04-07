package com.example.diem_danh.dto.response;

import lombok.*;

@Data @Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private Long expiresIn;
    private UserInfo user;

    @Data @Builder
    public static class UserInfo {
        private String userId;
        private String email;
        private String fullName;
        private String role;
        private String studentId;
    }
}