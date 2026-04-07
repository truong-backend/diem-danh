package com.example.diem_danh.repository;

import com.example.diem_danh.model.node.SessionNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SessionRepository extends Neo4jRepository<SessionNode, Long> {

    Optional<SessionNode> findBySessionId(String sessionId);

    Optional<SessionNode> findByQrToken(String qrToken);

    @Query("""
        MATCH (s:Session)-[:BELONGS_TO_CLASS]->(cr:ClassRoom {classId: $classId})
        RETURN s ORDER BY s.sessionNumber ASC
        """)
    List<SessionNode> findByClassId(String classId);

    @Query("MATCH (s:Session) RETURN count(s)")
    Long countAll();

    @Query("""
        MATCH (s:Session)-[:BELONGS_TO_CLASS]->(cr:ClassRoom {classId: $classId})
        RETURN count(s)
        """)
    Long countByClassId(String classId);
}