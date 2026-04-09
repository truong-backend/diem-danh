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

    /**
     * Loại cuộc trò chuyện:
     * - PRIVATE: chat 1-1 giữa 2 người
     * - GROUP: nhóm tự tạo bởi giáo viên/admin
     * - CLASS: nhóm lớp học (tự động tạo khi tạo lớp, gắn classId)
     */
    @Property("type")
    @Builder.Default
    private String type = "PRIVATE"; // PRIVATE | GROUP | CLASS

    /** Tên nhóm (null với PRIVATE) */
    @Property("name")
    private String name;

    /** classId liên kết — chỉ dùng với type = CLASS */
    @Property("classId")
    private String classId;

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

    /** userId admin nhóm (trong CLASS: giáo viên phụ trách) */
    @Property("adminIds")
    @Builder.Default
    private List<String> adminIds = new ArrayList<>();

    /** messageId của các tin nhắn được ghim */
    @Property("pinnedMessageIds")
    @Builder.Default
    private List<String> pinnedMessageIds = new ArrayList<>();

    /** true => đây là nhóm chung toàn hệ thống */
    @Property("isGlobal")
    @Builder.Default
    private boolean isGlobal = false;

    // ── Backward-compat ────────────────────────────────────────────
    public boolean isGroup() {
        return "GROUP".equals(type) || "CLASS".equals(type);
    }

    public void setGroup(boolean group) {
        // no-op — type là nguồn sự thật
    }
}
