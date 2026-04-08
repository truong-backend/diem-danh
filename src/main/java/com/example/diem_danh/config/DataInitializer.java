package com.example.diem_danh.config;

import com.example.diem_danh.model.node.UserNode;
import com.example.diem_danh.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedDefaultUsers();
    }

    private void seedDefaultUsers() {
        List<UserNode> defaults = List.of(
                UserNode.builder()
                        .userId("USR-ADMIN-001")
                        .email("admin@school.edu.vn")
                        .password(passwordEncoder.encode("Admin@123"))
                        .fullName("Quản trị viên")
                        .role("ADMIN")
                        .active(true)
                        .createdAt(LocalDateTime.now())
                        .build(),

                UserNode.builder()
                        .userId("USR-TEACHER-001")
                        .email("teacher@school.edu.vn")
                        .password(passwordEncoder.encode("Teacher@123"))
                        .fullName("Giáo viên Demo")
                        .role("TEACHER")
                        .active(true)
                        .createdAt(LocalDateTime.now())
                        .build(),

                UserNode.builder()
                        .userId("USR-SV-001")
                        .email("sv001@student.edu.vn")
                        .password(passwordEncoder.encode("Student@123"))
                        .fullName("Sinh viên Demo")
                        .role("STUDENT")
                        .studentId("SV001")
                        .active(true)
                        .createdAt(LocalDateTime.now())
                        .build()
        );

        for (UserNode user : defaults) {
            if (!userRepository.existsByEmail(user.getEmail())) {
                userRepository.save(user);
                log.info("[DataInitializer] Tạo tài khoản mặc định: {} ({})", user.getEmail(), user.getRole());
            } else {
                log.debug("[DataInitializer] Tài khoản đã tồn tại, bỏ qua: {}", user.getEmail());
            }
        }
    }
}