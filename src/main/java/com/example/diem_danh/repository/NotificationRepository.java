package com.example.diem_danh.repository;

import com.example.diem_danh.model.node.NotificationNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends Neo4jRepository<NotificationNode, Long> {

    @Query("MATCH (n:Notification {notificationId: $notificationId}) RETURN n")
    Optional<NotificationNode> findByNotificationId(String notificationId);

    @Query("""
        MATCH (n:Notification {recipientId: $recipientId})
        RETURN n ORDER BY n.createdAt DESC
        SKIP $skip LIMIT $limit
        """)
    List<NotificationNode> findByRecipientId(String recipientId, int skip, int limit);

    @Query("MATCH (n:Notification {recipientId: $recipientId, isRead: false}) RETURN count(n)")
    long countUnread(String recipientId);

    @Query("""
        MATCH (n:Notification {recipientId: $recipientId, isRead: false})
        SET n.isRead = true
        """)
    void markAllRead(String recipientId);
}