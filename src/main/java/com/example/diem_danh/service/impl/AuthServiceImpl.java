package com.example.diem_danh.service.impl;

import com.example.diem_danh.dto.request.ForgotPasswordRequest;
import com.example.diem_danh.dto.request.LoginRequest;
import com.example.diem_danh.dto.request.ResetPasswordRequest;
import com.example.diem_danh.dto.response.AuthResponse;
import com.example.diem_danh.exception.AttendanceException;
import com.example.diem_danh.model.node.UserNode;
import com.example.diem_danh.repository.UserRepository;
import com.example.diem_danh.security.JwtService;
import com.example.diem_danh.service.AuthService;
import com.example.diem_danh.service.MailService;
import com.example.diem_danh.service.RedisService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final RedisService redisService;
    private final MailService mailService;

    @Value("${app.password-reset.token-ttl-seconds:900}")
    private long resetTokenTtl;

    @Value("${app.password-reset.reset-url}")
    private String resetUrl;

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

    // Chổ cần paste: thay method refresh() trong AuthServiceImpl
    @Override
    @Transactional
    public AuthResponse refresh(String refreshToken) {
        // Kiểm tra format / chữ ký trước
        if (refreshToken == null || refreshToken.isBlank() || !jwtService.isTokenValid(refreshToken)) {
            throw AttendanceException.badRequest("Refresh token không hợp lệ hoặc đã hết hạn");
        }

        // Kiểm tra type == REFRESH để tránh dùng accessToken làm refreshToken
        try {
            var claims = jwtService.extractAllClaims(refreshToken);
            if (!"REFRESH".equals(claims.get("type"))) {
                throw AttendanceException.badRequest("Refresh token không hợp lệ");
            }
        } catch (Exception e) {
            throw AttendanceException.badRequest("Refresh token không hợp lệ hoặc đã hết hạn");
        }

        UserNode user = userRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> AttendanceException.badRequest("Refresh token không hợp lệ hoặc đã hết hạn"));

        if (!user.isActive()) {
            throw AttendanceException.forbidden("Tài khoản đã bị vô hiệu hóa");
        }

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
        if (accessToken != null && !accessToken.isBlank()) {
            try {
                long remainingMs = jwtService.extractExpiration(accessToken).getTime() - System.currentTimeMillis();
                redisService.blacklistJwt(accessToken, remainingMs / 1000);
            } catch (Exception ignored) {}
        }
        userRepository.findByRefreshToken(refreshToken).ifPresent(user -> {
            user.setRefreshToken(null);
            userRepository.save(user);
        });
    }

    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            redisService.saveResetToken(token, user.getEmail(), resetTokenTtl);
            String link = resetUrl + "?token=" + token;
            mailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), link);
        });
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = redisService.getEmailByResetToken(request.getToken())
                .orElseThrow(() -> AttendanceException.badRequest("Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn"));

        UserNode user = userRepository.findByEmail(email)
                .orElseThrow(() -> AttendanceException.notFound("Tài khoản không tồn tại"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setRefreshToken(null);
        userRepository.save(user);

        redisService.deleteResetToken(request.getToken());
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