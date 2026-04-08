package com.example.diem_danh.controller;

import com.example.diem_danh.dto.request.CreateUserRequest;
import com.example.diem_danh.dto.response.*;
import com.example.diem_danh.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> list(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(userService.listUsers(role, search, page, size)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> create(@Valid @RequestBody CreateUserRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Tạo user thành công", userService.createUser(req)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<UserResponse>> getOne(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> update(@PathVariable String id,
                                                            @Valid @RequestBody CreateUserRequest req) {
        return ResponseEntity.ok(ApiResponse.success(userService.updateUser(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("Xoá user thành công", null));
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> changeRole(@PathVariable String id,
                                                        @RequestBody Map<String, String> body) {
        userService.changeRole(id, body.get("role"));
        return ResponseEntity.ok(ApiResponse.success("Cập nhật role thành công", null));
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> activate(@PathVariable String id) {
        userService.activateUser(id);
        return ResponseEntity.ok(ApiResponse.success("Đã kích hoạt lại tài khoản", null));
    }

    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable String id) {
        userService.deactivateUser(id);
        return ResponseEntity.ok(ApiResponse.success("Đã vô hiệu hóa tài khoản", null));
    }
}