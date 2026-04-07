package com.example.diem_danh.model.node;

import lombok.*;
import org.springframework.data.neo4j.core.schema.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Node("ClassRoom")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassRoomNode {

    @Id @GeneratedValue
    private Long id;

    @Property("classId")
    private String classId;

    @Property("name")
    private String name;

    @Property("semester")
    private String semester;

    @Property("academicYear")
    private String academicYear;

    @Property("maxStudents")
    private Integer maxStudents;

    @Property("schedule")
    private String schedule; // "Mon,Wed 07:30-09:30"

    @Relationship(type = "BELONGS_TO", direction = Relationship.Direction.OUTGOING)
    private CourseNode course;

    @Relationship(type = "TEACHES", direction = Relationship.Direction.INCOMING)
    private UserNode teacher;

    @Relationship(type = "ENROLLED_IN", direction = Relationship.Direction.INCOMING)
    private List<UserNode> students = new ArrayList<>();
}