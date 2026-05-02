package com.example.diem_danh.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

/**
 * Service tập trung tất cả thao tác Redis:
 * - Cache QR token (key: qr:session:{sessionId})
 * - Cache session data (key: session:{sessionId})
 * - JWT blacklist khi logout (key: jwt:blacklist:{token})
 * - Rate limiting điểm danh (key: rate:attendance:{studentId}:{sessionId})
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RedisService {

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${app.redis.ttl.qr-token:300}")
    private long qrTokenTtl;

    @Value("${app.redis.ttl.session:600}")
    private long sessionTtl;

    @Value("${app.redis.ttl.jwt-blacklist:86400}")
    private long jwtBlacklistTtl;

    // ── Key builders ──────────────────────────────────────────────────────────

    private String qrKey(String sessionId)         { return "qr:session:" + sessionId; }
    private String sessionKey(String sessionId)    { return "session:" + sessionId; }
    private String jwtBlackKey(String token)       { return "jwt:blacklist:" + token; }
    private String attendanceLockKey(String studentId, String sessionId) {
        return "attendance:lock:" + studentId + ":" + sessionId;
    }

    // ── QR Token ──────────────────────────────────────────────────────────────

    public void saveQrToken(String sessionId, String qrToken, long ttlSeconds) {
        String key = qrKey(sessionId);
        redisTemplate.opsForValue().set(key, qrToken, Duration.ofSeconds(ttlSeconds));
        log.debug("QR token saved to Redis: key={}, ttl={}s", key, ttlSeconds);
    }

    public Optional<String> getQrToken(String sessionId) {
        Object value = redisTemplate.opsForValue().get(qrKey(sessionId));
        return Optional.ofNullable(value).map(Object::toString);
    }

    public void invalidateQrToken(String sessionId) {
        redisTemplate.delete(qrKey(sessionId));
        log.debug("QR token invalidated for session={}", sessionId);
    }

    // ── Generic cache ─────────────────────────────────────────────────────────

    public void cacheValue(String key, Object value, long ttlSeconds) {
        redisTemplate.opsForValue().set(key, value, Duration.ofSeconds(ttlSeconds));
    }

    public Optional<Object> getCachedValue(String key) {
        return Optional.ofNullable(redisTemplate.opsForValue().get(key));
    }

    public void deleteKey(String key) {
        redisTemplate.delete(key);
    }

    // ── JWT Blacklist ─────────────────────────────────────────────────────────

    public void blacklistJwt(String token, long remainingSeconds) {
        if (remainingSeconds > 0) {
            redisTemplate.opsForValue().set(
                    jwtBlackKey(token), "revoked",
                    Duration.ofSeconds(Math.min(remainingSeconds, jwtBlacklistTtl)));
            log.debug("JWT blacklisted, ttl={}s", remainingSeconds);
        }
    }

    public boolean isJwtBlacklisted(String token) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(jwtBlackKey(token)));
    }

    // ── Attendance duplicate-check lock ───────────────────────────────────────

    /**
     * Đặt lock để ngăn race-condition khi nhiều request điểm danh cùng lúc.
     * @return true nếu lock thành công (chưa điểm danh), false nếu đã tồn tại.
     */
    public boolean tryAttendanceLock(String studentId, String sessionId) {
        String key = attendanceLockKey(studentId, sessionId);
        Boolean success = redisTemplate.opsForValue()
                .setIfAbsent(key, "1", Duration.ofMinutes(10));
        return Boolean.TRUE.equals(success);
    }

    public void releaseAttendanceLock(String studentId, String sessionId) {
        redisTemplate.delete(attendanceLockKey(studentId, sessionId));
    }

    public boolean hasAttendanceLock(String studentId, String sessionId) {
        return Boolean.TRUE.equals(
                redisTemplate.hasKey(attendanceLockKey(studentId, sessionId)));
    }
}