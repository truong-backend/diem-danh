package com.example.diem_danh.controller;

import com.example.diem_danh.dto.request.CreateUserRequest;
import com.example.diem_danh.dto.request.UpdateUserRequest;
import com.example.diem_danh.dto.response.*;
import com.example.diem_danh.security.UserPrincipal;
import com.example.diem_danh.service.MinioService;
import com.example.diem_danh.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import java.nio.file.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final MinioService minioService;

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


    // Sửa endpoint PUT /{id}
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT')")
    public ResponseEntity<ApiResponse<UserResponse>> update(@PathVariable String id,
                                                            @Valid @RequestBody UpdateUserRequest req) {
        return ResponseEntity.ok(ApiResponse.success(userService.updateUser(id, req)));
    }

    // Thêm endpoint PUT /me/avatar
    @PutMapping("/me/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateMyProfile(
            @RequestBody UpdateUserRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(userService.updateUser(principal.getUserId(), req)));
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<String>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) throws Exception {
        // Upload lên MinIO
        String avatarUrl = minioService.uploadFile("avatars", file);

        // Lưu URL vào DB
        UpdateUserRequest req = new UpdateUserRequest();
        req.setAvatarUrl(avatarUrl);
        userService.updateUser(principal.getUserId(), req);

        return ResponseEntity.ok(ApiResponse.success(avatarUrl));
    }
}