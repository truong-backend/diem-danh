package com.example.diem_danh.repository;

import com.example.diem_danh.model.node.UserNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends Neo4jRepository<UserNode, Long> {

    Optional<UserNode> findByEmail(String email);

    Optional<UserNode> findByUserId(String userId);

    boolean existsByEmail(String email);

    @Query("MATCH (u:User) WHERE u.role = $role RETURN u")
    List<UserNode> findByRole(String role);

    @Query("MATCH (u:User) WHERE u.role = $role RETURN count(u)")
    Long countByRole(String role);

    @Query("MATCH (u:User {refreshToken: $token}) RETURN u LIMIT 1")
    Optional<UserNode> findByRefreshToken(String token);

    @Query("""
        MATCH (u:User)
        WHERE ($role IS NULL OR u.role = $role)
          AND ($search IS NULL OR u.fullName CONTAINS $search OR u.email CONTAINS $search)
        RETURN u
        ORDER BY u.createdAt DESC
        SKIP $skip LIMIT $limit
        """)
    List<UserNode> searchUsers(String role, String search, int skip, int limit);

    @Query("""
        MATCH (u:User)
        WHERE ($role IS NULL OR u.role = $role)
          AND ($search IS NULL OR u.fullName CONTAINS $search OR u.email CONTAINS $search)
        RETURN count(u)
        """)
    Long countSearchUsers(String role, String search);

    /**
     * Search all users (any role) for chat — by fullName, email or studentId.
     * Used by the chat user-picker without role restriction.
     */
    @Query("""
        MATCH (u:User)
        WHERE u.active = true
          AND ($keyword IS NULL
               OR u.fullName CONTAINS $keyword
               OR u.email CONTAINS $keyword
               OR u.studentId CONTAINS $keyword
               OR u.userId CONTAINS $keyword)
        RETURN u
        ORDER BY u.fullName ASC
        SKIP $skip LIMIT $limit
        """)
    List<UserNode> searchUsersForChat(String keyword, int skip, int limit);
}