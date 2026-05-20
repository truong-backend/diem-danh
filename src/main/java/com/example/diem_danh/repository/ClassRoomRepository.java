package com.example.diem_danh.repository;

import com.example.diem_danh.model.node.ClassRoomNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassRoomRepository extends Neo4jRepository<ClassRoomNode, Long> {

    Optional<ClassRoomNode> findByClassId(String classId);

    // ✅ FIX: course và teacher là single object → KHÔNG dùng collect()
    // students là List → dùng collect()
    @Query("""
        MATCH (cr:ClassRoom {classId: $classId})
        OPTIONAL MATCH (cr)-[:BELONGS_TO]->(c:Course)
        OPTIONAL MATCH (t:User)-[:TEACHES]->(cr)
        OPTIONAL MATCH (s:User)-[:ENROLLED_IN]->(cr)
        RETURN cr, c AS course, t AS teacher, collect(s) AS students
        """)
    Optional<ClassRoomNode> findByClassIdWithDetails(String classId);

    // ✅ FIX: tương tự — course và teacher là single, không collect()
    @Query("""
        MATCH (cr:ClassRoom)
        OPTIONAL MATCH (cr)-[:BELONGS_TO]->(c:Course)
        OPTIONAL MATCH (t:User)-[:TEACHES]->(cr)
        RETURN cr, c AS course, t AS teacher
        ORDER BY cr.academicYear DESC, cr.semester DESC
        """)
    List<ClassRoomNode> findAllWithDetails();

    @Query("""
        MATCH (t:User {userId: $teacherId})-[:TEACHES]->(cr:ClassRoom)
        OPTIONAL MATCH (cr)-[:BELONGS_TO]->(c:Course)
        RETURN cr, c AS course, t AS teacher
        ORDER BY cr.academicYear DESC, cr.semester DESC
        """)
    List<ClassRoomNode> findByTeacherId(String teacherId);

    @Query("""
        MATCH (s:User {userId: $studentId})-[:ENROLLED_IN]->(cr:ClassRoom)
        OPTIONAL MATCH (cr)-[:BELONGS_TO]->(c:Course)
        OPTIONAL MATCH (t:User)-[:TEACHES]->(cr)
        RETURN cr, c AS course, t AS teacher
        """)
    List<ClassRoomNode> findByStudentId(String studentId);

    @Query("MATCH (cr:ClassRoom) RETURN count(cr)")
    Long countAll();

    @Query("""
        MATCH (cr:ClassRoom {classId: $classId})<-[:ENROLLED_IN]-(s:User)
        RETURN count(s)
        """)
    Long countStudentsInClass(String classId);

    @Query("""
        MATCH (cr:ClassRoom {classId: $classId})
        MATCH (s:User {userId: $studentId})
        MERGE (s)-[:ENROLLED_IN]->(cr)
        """)
    void enrollStudent(String classId, String studentId);

    @Query("""
        MATCH (s:User {userId: $studentId})-[r:ENROLLED_IN]->(cr:ClassRoom {classId: $classId})
        DELETE r
        """)
    void unenrollStudent(String classId, String studentId);
}