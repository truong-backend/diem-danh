package com.example.diem_danh.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {
    private String conversationId;

    /** PRIVATE | GROUP | CLASS */
    private String type;

    private String name;

    /** classId — chỉ có với type=CLASS */
    private String classId;

    private String avatarUrl;
    private String createdBy;
    private LocalDateTime createdAt;
    private List<String> memberIds;
    private List<String> adminIds;
    private List<String> pinnedMessageIds;

    /** Tin nhắn cuối (dùng cho sidebar preview). Null nếu chưa có tin nhắn. */
    private MessageResponse lastMessage;

    // Backward-compat: isGroup = true khi type là GROUP hoặc CLASS
    public boolean isGroup() {
        return "GROUP".equals(type) || "CLASS".equals(type);
    }
}
