package com.example.diem_danh.model.node;


import com.example.diem_danh.model.enums.Role;
import lombok.*;
import org.springframework.data.neo4j.core.schema.*;

import java.time.LocalDateTime;
import java.util.Set;

@Node("User")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserNode {

    @Id @GeneratedValue
    private Long id;

    @Property("userId")
    private String userId; // e.g. "USR-001"

    @Property("email")
    private String email;

    @Property("password")
    private String password;

    @Property("fullName")
    private String fullName;

    @Property("role")
    private String role; // store as string in Neo4j

    @Property("studentId")
    private String studentId; // null for admin/teacher

    @Property("phone")
    private String phone;

    @Property("active")
    private boolean active = true;

    @Property("createdAt")
    private LocalDateTime createdAt;

    @Property("refreshToken")
    private String refreshToken;
}