package com.example.diem_danh.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secretKey;

    @Value("${app.jwt.expiration}")
    private long jwtExpiration;

    @Value("${app.jwt.qr-expiration}")
    private long qrExpiration;

    public String generateToken(String subject, Map<String, Object> extraClaims) {
        return buildToken(subject, extraClaims, jwtExpiration);
    }

    public String generateQrToken(String sessionId, String classId) {
        return buildToken(sessionId, Map.of("type", "QR", "classId", classId), qrExpiration);
    }

    public String generateRefreshToken(String subject) {
        return buildToken(subject, Map.of("type", "REFRESH"), 7 * 24 * 60 * 60 * 1000L);
    }

    private String buildToken(String subject, Map<String, Object> extraClaims, long expiration) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean isQrTokenValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return "QR".equals(claims.get("type")) && !isTokenExpired(token);
        } catch (JwtException e) {
            return false;
        }
    }

    public String extractSubject(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(extractAllClaims(token));
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public long getQrExpiration() {
        return qrExpiration;
    }
}