package com.example.diem_danh.model.node;

import lombok.*;
import org.springframework.data.neo4j.core.schema.*;

@Node("Course")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseNode {

    @Id @GeneratedValue
    private Long id;

    @Property("courseId")
    private String courseId;

    @Property("name")
    private String name;

    @Property("code")
    private String code;

    @Property("credits")
    private Integer credits;

    @Property("description")
    private String description;
}