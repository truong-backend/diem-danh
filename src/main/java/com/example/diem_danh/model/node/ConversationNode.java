package com.example.diem_danh.model.node;

import lombok.*;
import org.springframework.data.neo4j.core.schema.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Node("Conversation")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationNode {

    @Id @GeneratedValue
    private Long id;

    @Property("conversationId")
    private String conversationId;

    /** null => chat 1-1; non-null => nhóm */
    @Property("name")
    private String name;

    @Property("isGroup")
    private boolean isGroup;

    @Property("avatarUrl")
    private String avatarUrl;

    /** userId của người tạo nhóm */
    @Property("createdBy")
    private String createdBy;

    @Property("createdAt")
    private LocalDateTime createdAt;

    /** Danh sách userId thành viên (lưu flat trong Neo4j) */
    @Property("memberIds")
    @Builder.Default
    private List<String> memberIds = new ArrayList<>();

    /** userId admin nhóm */
    @Property("adminIds")
    @Builder.Default
    private List<String> adminIds = new ArrayList<>();

    /** messageId của các tin nhắn được ghim */
    @Property("pinnedMessageIds")
    @Builder.Default
    private List<String> pinnedMessageIds = new ArrayList<>();
}