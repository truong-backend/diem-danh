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
        RETURN a, collect(s), collect(u)
        """)
    List<AttendanceNode> findBySessionId(String sessionId);

    @Query("""
        MATCH (a:Attendance)-[:ATTENDED_BY]->(u:User {userId: $studentId})
        MATCH (a)-[:FOR_SESSION]->(s:Session)
        RETURN a, collect(u), collect(s)
        ORDER BY s.startTime DESC
        """)
    List<AttendanceNode> findByStudentId(String studentId);

    @Query("""
        MATCH (a:Attendance)-[:FOR_SESSION]->(s:Session {sessionId: $sessionId})
        MATCH (a)-[:ATTENDED_BY]->(u:User {userId: $studentId})
        RETURN a LIMIT 1
        """)
    Optional<AttendanceNode> findBySessionAndStudent(String sessionId, String studentId);

    @Query("""
        MATCH (a:Attendance)-[:FOR_SESSION]->(s:Session)-[:BELONGS_TO_CLASS]->(cr:ClassRoom {classId: $classId})
        MATCH (a)-[:ATTENDED_BY]->(u:User)
        WHERE a.status = 'PRESENT' OR a.status = 'LATE'
        RETURN count(a) * 1.0 / (
            (MATCH (s2:Session)-[:BELONGS_TO_CLASS]->(cr2:ClassRoom {classId: $classId}) RETURN count(s2)) *
            (MATCH (u2:User)-[:ENROLLED_IN]->(cr3:ClassRoom {classId: $classId}) RETURN count(u2))
        ) AS rate
        """)
    Double getAttendanceRateByClass(String classId);

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