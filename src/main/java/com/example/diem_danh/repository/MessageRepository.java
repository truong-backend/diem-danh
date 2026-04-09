package com.example.diem_danh.repository;

import com.example.diem_danh.model.node.MessageNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends Neo4jRepository<MessageNode, Long> {

    @Query("MATCH (m:Message {messageId: $messageId}) RETURN m")
    Optional<MessageNode> findByMessageId(String messageId);

    @Query("""
        MATCH (m:Message {conversationId: $conversationId})
        RETURN m ORDER BY m.createdAt DESC
        SKIP $skip LIMIT $limit
        """)
    List<MessageNode> findByConversationId(String conversationId, int skip, int limit);

    @Query("""
        MATCH (m:Message {conversationId: $conversationId})
        WHERE m.content CONTAINS $keyword AND m.isDeleted = false
        RETURN m ORDER BY m.createdAt DESC
        """)
    List<MessageNode> searchMessages(String conversationId, String keyword);

    @Query("""
        MATCH (m:Message {conversationId: $conversationId, isPinned: true})
        RETURN m ORDER BY m.createdAt DESC
        """)
    List<MessageNode> findPinnedMessages(String conversationId);
}