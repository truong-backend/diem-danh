package com.example.diem_danh.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateUserRequest {
    @NotBlank
    private String fullName;
    private String phone;
    private String password; // optional — để trống = không đổi
    private String role;
    private String avatarUrl; // cho profile
}