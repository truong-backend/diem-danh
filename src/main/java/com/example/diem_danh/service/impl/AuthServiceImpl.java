package com.example.diem_danh.service.impl;

import com.example.diem_danh.dto.request.LoginRequest;
import com.example.diem_danh.dto.response.AuthResponse;
import com.example.diem_danh.exception.AttendanceException;
import com.example.diem_danh.model.node.UserNode;
import com.example.diem_danh.repository.UserRepository;
import com.example.diem_danh.security.JwtService;
import com.example.diem_danh.service.AuthService;
import com.example.diem_danh.service.RedisService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final RedisService redisService;

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        UserNode user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> AttendanceException.badRequest("Email hoặc mật khẩu không đúng"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw AttendanceException.badRequest("Email hoặc mật khẩu không đúng");
        }
        if (!user.isActive()) {
            throw AttendanceException.forbidden("Tài khoản đã bị vô hiệu hóa");
        }

        String accessToken = jwtService.generateToken(user.getEmail(),
                Map.of("role", user.getRole(), "userId", user.getUserId()));
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        return buildAuthResponse(accessToken, refreshToken, user);
    }

    @Override
    @Transactional
    public AuthResponse refresh(String refreshToken) {
        if (!jwtService.isTokenValid(refreshToken)) {
            throw AttendanceException.badRequest("Refresh token không hợp lệ");
        }

        UserNode user = userRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> AttendanceException.badRequest("Refresh token không hợp lệ"));

        String newAccess = jwtService.generateToken(user.getEmail(),
                Map.of("role", user.getRole(), "userId", user.getUserId()));
        String newRefresh = jwtService.generateRefreshToken(user.getEmail());

        user.setRefreshToken(newRefresh);
        userRepository.save(user);

        return buildAuthResponse(newAccess, newRefresh, user);
    }

    @Override
    @Transactional
    public void logout(String refreshToken, String accessToken) {
        // Blacklist access token vào Redis để vô hiệu hóa ngay
        if (accessToken != null && !accessToken.isBlank()) {
            try {
                long remainingMs = jwtService.extractExpiration(accessToken).getTime() - System.currentTimeMillis();
                redisService.blacklistJwt(accessToken, remainingMs / 1000);
            } catch (Exception ignored) {}
        }
        // Xóa refresh token khỏi DB
        userRepository.findByRefreshToken(refreshToken).ifPresent(user -> {
            user.setRefreshToken(null);
            userRepository.save(user);
        });
    }

    private AuthResponse buildAuthResponse(String accessToken, String refreshToken, UserNode user) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(86400L)
                .user(AuthResponse.UserInfo.builder()
                        .userId(user.getUserId())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .role(user.getRole())
                        .studentId(user.getStudentId())
                        .avatarUrl(user.getAvatarUrl())
                        .build())
                .build();
    }
}