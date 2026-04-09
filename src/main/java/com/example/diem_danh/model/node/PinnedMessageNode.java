package com.example.diem_danh.model.node;

import lombok.*;
import org.springframework.data.neo4j.core.schema.*;

import java.time.LocalDateTime;

/**
 * Thực thể ghim tin nhắn.
 * Tách biệt khỏi MessageNode để tuân thủ nghiệp vụ:
 * - Một conversation có thể có nhiều tin ghim.
 * - Không sửa trực tiếp bảng Message khi ghim/bỏ ghim.
 * (isPinned trên MessageNode vẫn giữ để tương thích, nhưng nguồn sự thật là bảng này)
 */
@Node("PinnedMessage")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PinnedMessageNode {

    @Id @GeneratedValue
    private Long id;

    @Property("pinnedId")
    private String pinnedId;

    @Property("messageId")
    private String messageId;

    @Property("conversationId")
    private String conversationId;

    /** userId của người thực hiện ghim (phải là TEACHER hoặc ADMIN) */
    @Property("pinnedBy")
    private String pinnedBy;

    @Property("pinnedAt")
    private LocalDateTime pinnedAt;
}
