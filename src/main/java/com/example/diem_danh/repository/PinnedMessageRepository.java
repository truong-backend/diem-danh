package com.example.diem_danh.repository;

import com.example.diem_danh.model.node.PinnedMessageNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PinnedMessageRepository extends Neo4jRepository<PinnedMessageNode, Long> {

    @Query("MATCH (p:PinnedMessage {messageId: $messageId}) RETURN p")
    Optional<PinnedMessageNode> findByMessageId(String messageId);

    /** Lấy tất cả tin ghim trong conversation, sắp xếp theo pinnedAt giảm dần */
    @Query("""
        MATCH (p:PinnedMessage {conversationId: $conversationId})
        RETURN p ORDER BY p.pinnedAt DESC
        """)
    List<PinnedMessageNode> findByConversationId(String conversationId);

    @Query("MATCH (p:PinnedMessage {messageId: $messageId}) RETURN count(p) > 0")
    boolean existsByMessageId(String messageId);

    @Query("""
        MATCH (p:PinnedMessage {messageId: $messageId})
        DETACH DELETE p
        """)
    void deleteByMessageId(String messageId);
}