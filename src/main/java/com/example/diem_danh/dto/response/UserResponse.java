package com.example.diem_danh.dto.response;

import lombok.*;

@Data @Builder
public class UserResponse {
    private Long id;
    private String userId;
    private String email;
    private String fullName;
    private String role;
    private String studentId;
    private String phone;
    private boolean active;
    private String createdAt;
}