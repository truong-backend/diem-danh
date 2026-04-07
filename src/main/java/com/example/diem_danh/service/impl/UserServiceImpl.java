package com.example.diem_danh.service.impl;

import com.example.diem_danh.dto.request.CreateUserRequest;
import com.example.diem_danh.dto.response.PageResponse;
import com.example.diem_danh.dto.response.UserResponse;
import com.example.diem_danh.exception.AttendanceException;
import com.example.diem_danh.model.node.UserNode;
import com.example.diem_danh.repository.UserRepository;
import com.example.diem_danh.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw AttendanceException.conflict("Email đã tồn tại");
        }

        UserNode user = UserNode.builder()
                .userId("USR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .role(req.getRole())
                .studentId(req.getStudentId())
                .phone(req.getPhone())
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        return toResponse(userRepository.save(user));
    }

    @Override
    public UserResponse getUserById(String userId) {
        return toResponse(findUser(userId));
    }

    @Override
    @Transactional
    public UserResponse updateUser(String userId, CreateUserRequest req) {
        UserNode user = findUser(userId);
        user.setFullName(req.getFullName());
        user.setPhone(req.getPhone());
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(req.getPassword()));
        }
        return toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void deleteUser(String userId) {
        UserNode user = findUser(userId);
        user.setActive(false);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void changeRole(String userId, String role) {
        UserNode user = findUser(userId);
        user.setRole(role);
        userRepository.save(user);
    }

    @Override
    public PageResponse<UserResponse> listUsers(String role, String search, int page, int size) {
        int skip = page * size;
        List<UserNode> users = userRepository.searchUsers(role, search, skip, size);
        Long total = userRepository.countSearchUsers(role, search);
        List<UserResponse> content = users.stream().map(this::toResponse).collect(Collectors.toList());

        return PageResponse.<UserResponse>builder()
                .content(content)
                .page(page)
                .size(size)
                .totalElements(total)
                .totalPages((int) Math.ceil((double) total / size))
                .last(page >= (int) Math.ceil((double) total / size) - 1)
                .build();
    }

    private UserNode findUser(String userId) {
        return userRepository.findByUserId(userId)
                .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy user: " + userId));
    }

    public UserResponse toResponse(UserNode user) {
        return UserResponse.builder()
                .id(user.getId())
                .userId(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .studentId(user.getStudentId())
                .phone(user.getPhone())
                .active(user.isActive())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }
}