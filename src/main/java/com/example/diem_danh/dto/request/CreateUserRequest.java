package com.example.diem_danh.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateUserRequest {
    @NotBlank @Email
    private String email;
    @NotBlank @Size(min = 6)
    private String password;
    @NotBlank
    private String fullName;
    @NotBlank
    private String role; // ADMIN, TEACHER, STUDENT
    private String studentId;
    private String phone;
}