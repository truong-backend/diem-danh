package com.example.diem_danh.service.impl;

import com.example.diem_danh.controller.ChatWebSocketController;
import com.example.diem_danh.dto.request.CreateUserRequest;
import com.example.diem_danh.dto.request.UpdateUserRequest;
import com.example.diem_danh.dto.response.PageResponse;
import com.example.diem_danh.dto.response.UserResponse;
import com.example.diem_danh.exception.AttendanceException;
import com.example.diem_danh.model.node.ConversationNode;
import com.example.diem_danh.model.node.UserNode;
import com.example.diem_danh.repository.ConversationRepository;
import com.example.diem_danh.repository.UserRepository;
import com.example.diem_danh.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ChatWebSocketController wsController;
    private final ConversationRepository conversationRepository;

    // ── Create ────────────────────────────────────────────────────────────────

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

        UserNode saved = userRepository.save(user);
        addToGlobalConversation(saved.getUserId());
        broadcastUserJoined(saved);
        return toResponse(saved);
    }

    // ── Import Excel ──────────────────────────────────────────────────────────

    @Override
    @Transactional
    public List<UserResponse> importFromExcel(MultipartFile file) {
        List<UserResponse> imported = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            // Hàng 0 là header, bắt đầu từ hàng 1
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                try {
                    String email     = getCellString(row, 0);
                    String fullName  = getCellString(row, 1);
                    String studentId = getCellString(row, 2);
                    String phone     = getCellString(row, 3);
                    String role      = getCellString(row, 4);
                    String password  = getCellString(row, 5);

                    if (email.isBlank() || fullName.isBlank()) {
                        errors.add("Hàng " + (i + 1) + ": email/fullName không được để trống");
                        continue;
                    }
                    if (userRepository.existsByEmail(email)) {
                        errors.add("Hàng " + (i + 1) + ": email " + email + " đã tồn tại");
                        continue;
                    }

                    String finalRole = (role == null || role.isBlank()) ? "STUDENT" : role.toUpperCase();
                    String finalPwd  = (password == null || password.isBlank()) ? "123456" : password;

                    UserNode user = UserNode.builder()
                            .userId("USR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                            .email(email.trim())
                            .password(passwordEncoder.encode(finalPwd))
                            .fullName(fullName.trim())
                            .role(finalRole)
                            .studentId(studentId != null && !studentId.isBlank() ? studentId.trim() : null)
                            .phone(phone != null && !phone.isBlank() ? phone.trim() : null)
                            .active(true)
                            .createdAt(LocalDateTime.now())
                            .build();

                    UserNode saved = userRepository.save(user);
                    addToGlobalConversation(saved.getUserId());
                    broadcastUserJoined(saved);
                    imported.add(toResponse(saved));

                } catch (Exception e) {
                    errors.add("Hàng " + (i + 1) + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Không thể đọc file Excel: " + e.getMessage());
        }

        if (!errors.isEmpty()) {
            log.warn("Import Excel - {} lỗi: {}", errors.size(), errors);
        }
        return imported;
    }

    private String getCellString(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double v = cell.getNumericCellValue();
                yield (v == Math.floor(v)) ? String.valueOf((long) v) : String.valueOf(v);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    // ── Read / Update / Delete ────────────────────────────────────────────────

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
    public UserResponse updateUser(String userId, UpdateUserRequest req) {
        UserNode user = findUser(userId);
        if (req.getFullName() != null) user.setFullName(req.getFullName());
        if (req.getPhone() != null) user.setPhone(req.getPhone());
        if (req.getPassword() != null && !req.getPassword().isBlank())
            user.setPassword(passwordEncoder.encode(req.getPassword()));
        if (req.getRole() != null && !req.getRole().isBlank()) user.setRole(req.getRole());
        if (req.getAvatarUrl() != null) user.setAvatarUrl(req.getAvatarUrl());
        return toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void deleteUser(String userId) {
        userRepository.delete(findUser(userId));
    }

    @Override
    @Transactional
    public void changeRole(String userId, String role) {
        UserNode user = findUser(userId);
        user.setRole(role);
        userRepository.save(user);
    }

    @Override
    public void activateUser(String userId) {
        UserNode user = findUser(userId);
        user.setActive(true);
        userRepository.save(user);
    }

    @Override
    public void deactivateUser(String userId) {
        UserNode user = findUser(userId);
        user.setActive(false);
        userRepository.save(user);
    }

    @Override
    public PageResponse<UserResponse> listUsers(String role, String search, int page, int size) {
        int skip = page * size;
        List<UserNode> users = userRepository.searchUsers(role, search, skip, size);
        Long total = userRepository.countSearchUsers(role, search);
        List<UserResponse> content = users.stream().map(this::toResponse).collect(Collectors.toList());
        return PageResponse.<UserResponse>builder()
                .content(content).page(page).size(size).totalElements(total)
                .totalPages((int) Math.ceil((double) total / size))
                .last(page >= (int) Math.ceil((double) total / size) - 1)
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private UserNode findUser(String userId) {
        return userRepository.findByUserId(userId)
                .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy user: " + userId));
    }

    private void addToGlobalConversation(String userId) {
        try {
            ConversationNode globalConv = conversationRepository.findGlobalConversation()
                    .orElseGet(() -> {
                        ConversationNode c = ConversationNode.builder()
                                .conversationId("GLOBAL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                                .name("Toàn trường")
                                .isGlobal(true)
                                .createdBy("SYSTEM")
                                .createdAt(LocalDateTime.now())
                                .memberIds(new ArrayList<>())
                                .adminIds(new ArrayList<>())
                                .pinnedMessageIds(new ArrayList<>())
                                .build();
                        return conversationRepository.save(c);
                    });
            if (!globalConv.getMemberIds().contains(userId)) {
                globalConv.getMemberIds().add(userId);
                conversationRepository.save(globalConv);
            }
        } catch (Exception ignored) {}
    }

    private void broadcastUserJoined(UserNode saved) {
        try {
            userRepository.findAll().stream()
                    .filter(u -> u.isActive() && !u.getUserId().equals(saved.getUserId()))
                    .forEach(u -> wsController.notifyUserJoined(u.getUserId(), toResponse(saved)));
        } catch (Exception ignored) {}
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
                .avatarUrl(user.getAvatarUrl())
                .active(user.isActive())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }
}