package com.example.diem_danh.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Endpoint kiểm tra sức khoẻ của hệ thống (Redis + RabbitMQ).
 * GET /api/health
 */
@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final RedisTemplate<String, Object> redisTemplate;
    private final RabbitTemplate rabbitTemplate;

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("timestamp", LocalDateTime.now().toString());
        result.put("status", "UP");
        result.put("redis", checkRedis());
        result.put("rabbitmq", checkRabbitMQ());
        return ResponseEntity.ok(result);
    }

    private Map<String, String> checkRedis() {
        Map<String, String> status = new LinkedHashMap<>();
        try {
            redisTemplate.opsForValue().set("health:ping", "pong");
            Object pong = redisTemplate.opsForValue().get("health:ping");
            redisTemplate.delete("health:ping");
            status.put("status", "pong".equals(pong) ? "UP" : "DEGRADED");
        } catch (Exception e) {
            status.put("status", "DOWN");
            status.put("error", e.getMessage());
        }
        return status;
    }

    private Map<String, String> checkRabbitMQ() {
        Map<String, String> status = new LinkedHashMap<>();
        try {
            rabbitTemplate.execute(channel -> {
                channel.basicQos(1);
                return null;
            });
            status.put("status", "UP");
        } catch (Exception e) {
            status.put("status", "DOWN");
            status.put("error", e.getMessage());
        }
        return status;
    }
}
