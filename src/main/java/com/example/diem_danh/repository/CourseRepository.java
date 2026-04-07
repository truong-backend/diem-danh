package com.example.diem_danh.repository;


import com.example.diem_danh.model.node.CourseNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends Neo4jRepository<CourseNode, Long> {

    Optional<CourseNode> findByCourseId(String courseId);

    boolean existsByCode(String code);

    @Query("MATCH (c:Course) RETURN c ORDER BY c.name")
    List<CourseNode> findAllOrdered();
}