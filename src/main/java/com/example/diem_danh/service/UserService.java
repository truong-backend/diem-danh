package com.example.diem_danh.service;

import com.example.diem_danh.dto.request.CreateUserRequest;
import com.example.diem_danh.dto.response.PageResponse;
import com.example.diem_danh.dto.response.UserResponse;

public interface UserService {
    UserResponse createUser(CreateUserRequest req);
    UserResponse getUserById(String userId);
    UserResponse updateUser(String userId, CreateUserRequest req);
    void deleteUser(String userId);
    void changeRole(String userId, String role);
    PageResponse<UserResponse> listUsers(String role, String search, int page, int size);

    void activateUser(String userId);
    void deactivateUser(String userId);
}