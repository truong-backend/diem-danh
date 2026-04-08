package com.example.diem_danh.repository;

import com.example.diem_danh.model.node.ConversationNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends Neo4jRepository<ConversationNode, Long> {

    Optional<ConversationNode> findByConversationId(String conversationId);

    @Query("MATCH (c:Conversation) WHERE $userId IN c.memberIds RETURN c ORDER BY c.createdAt DESC")
    List<ConversationNode> findByMemberId(String userId);

    @Query("""
        MATCH (c:Conversation)
        WHERE c.isGroup = false
          AND $uid1 IN c.memberIds
          AND $uid2 IN c.memberIds
        RETURN c LIMIT 1
        """)
    Optional<ConversationNode> findDirectConversation(String uid1, String uid2);
}