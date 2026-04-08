package com.example.diem_danh.repository;

import com.example.diem_danh.model.node.AttendanceNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Map;

@Repository
public interface AttendanceRepository extends Neo4jRepository<AttendanceNode, Long> {

    Optional<AttendanceNode> findByAttendanceId(String attendanceId);

    @Query("""
        MATCH (a:Attendance)-[:FOR_SESSION]->(s:Session {sessionId: $sessionId})
        MATCH (a)-[:ATTENDED_BY]->(u:User)
        RETURN a, s, u
        ORDER BY u.fullName ASC
        """)
    List<AttendanceNode> findBySessionId(String sessionId);

    @Query("""
        MATCH (a:Attendance)-[:ATTENDED_BY]->(u:User {userId: $studentId})
        MATCH (a)-[:FOR_SESSION]->(s:Session)
        OPTIONAL MATCH (s)-[:BELONGS_TO_CLASS]->(cr:ClassRoom)
        RETURN a, u, s, cr
        ORDER BY s.startTime DESC
        """)
    List<AttendanceNode> findByStudentId(String studentId);

    @Query("""
        MATCH (a:Attendance)-[:FOR_SESSION]->(s:Session {sessionId: $sessionId})
        MATCH (a)-[:ATTENDED_BY]->(u:User {userId: $studentId})
        RETURN a, s, u
        LIMIT 1
        """)
    Optional<AttendanceNode> findBySessionAndStudent(String sessionId, String studentId);

    @Query("""
        MATCH (s:Session)-[:BELONGS_TO_CLASS]->(cr:ClassRoom {classId: $classId})
        OPTIONAL MATCH (a:Attendance)-[:FOR_SESSION]->(s)
        WHERE a.status IN ['PRESENT', 'LATE']
        RETURN s.sessionId AS sessionId, s.sessionNumber AS sessionNumber,
               s.startTime AS startTime, count(a) AS presentCount
        ORDER BY s.sessionNumber
        """)
    List<Map<String, Object>> getSessionAttendanceSummary(String classId);

    @Query("""
        MATCH (a:Attendance)-[:ATTENDED_BY]->(u:User {userId: $studentId})
        MATCH (a)-[:FOR_SESSION]->(s:Session)-[:BELONGS_TO_CLASS]->(cr:ClassRoom {classId: $classId})
        RETURN a.status AS status, count(a) AS count
        """)
    List<Map<String, Object>> getStudentAttendanceSummaryByClass(String studentId, String classId);
}