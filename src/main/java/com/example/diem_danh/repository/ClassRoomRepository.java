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

    @Query("""
        MATCH (cr:ClassRoom)-[:BELONGS_TO]->(c:Course)
        MATCH (t:User)-[:TEACHES]->(cr)
        RETURN cr, collect(c), collect(t)
        """)
    List<ClassRoomNode> findAllWithDetails();

    @Query("""
        MATCH (t:User {userId: $teacherId})-[:TEACHES]->(cr:ClassRoom)
        RETURN cr
        ORDER BY cr.academicYear DESC, cr.semester DESC
        """)
    List<ClassRoomNode> findByTeacherId(String teacherId);

    @Query("""
        MATCH (s:User {userId: $studentId})-[:ENROLLED_IN]->(cr:ClassRoom)
        RETURN cr
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
        MATCH (cr:ClassRoom {classId: $classId})<-[:ENROLLED_IN]-(s:User)
        RETURN s
        ORDER BY s.fullName
        """)
    List<com.example.diem_danh.model.node.UserNode> findStudentsByClassId(String classId);

    @Query("""
        MATCH (cr:ClassRoom {classId: $classId})
        MATCH (s:User {userId: $studentId})
        CREATE (s)-[:ENROLLED_IN]->(cr)
        """)
    void enrollStudent(String classId, String studentId);

    @Query("""
        MATCH (s:User {userId: $studentId})-[r:ENROLLED_IN]->(cr:ClassRoom {classId: $classId})
        DELETE r
        """)
    void unenrollStudent(String classId, String studentId);
}