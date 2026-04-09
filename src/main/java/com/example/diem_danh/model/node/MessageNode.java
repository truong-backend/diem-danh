package com.example.diem_danh.model.node;

import com.example.diem_danh.model.enums.MessageType;
import lombok.*;
import org.springframework.data.neo4j.core.schema.*;

import java.time.LocalDateTime;

@Node("Message")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageNode {

    @Id @GeneratedValue
    private Long id;

    @Property("messageId")
    private String messageId;

    @Property("conversationId")
    private String conversationId;

    @Property("senderId")
    private String senderId;

    @Property("senderName")
    private String senderName;

    @Property("content")
    private String content;

    @Property("type")
    private String type; // TEXT | FILE

    /** Dùng khi type = FILE */
    @Property("fileUrl")
    private String fileUrl;

    @Property("fileName")
    private String fileName;

    @Property("isEdited")
    private boolean edited;

    @Property("isDeleted")
    private boolean deleted;

    @Property("isPinned")
    private boolean pinned;

    @Property("createdAt")
    private LocalDateTime createdAt;

    @Property("updatedAt")
    private LocalDateTime updatedAt;
}