package com.example.diem_danh.model.node;

import lombok.*;
import org.springframework.data.neo4j.core.schema.*;

import java.time.LocalDateTime;

@Node("Session")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionNode {

    @Id @GeneratedValue
    private Long id;

    @Property("sessionId")
    private String sessionId;

    @Property("sessionNumber")
    private Integer sessionNumber;

    @Property("startTime")
    private LocalDateTime startTime;

    @Property("endTime")
    private LocalDateTime endTime;

    @Property("room")
    private String room;

    @Property("qrToken")
    private String qrToken;

    @Property("qrExpiresAt")
    private LocalDateTime qrExpiresAt;

    @Property("qrImageBase64")
    private String qrImageBase64;

    @Property("status")
    private String status; // SCHEDULED, ONGOING, COMPLETED

    @Relationship(type = "BELONGS_TO_CLASS", direction = Relationship.Direction.OUTGOING)
    private ClassRoomNode classRoom;
}