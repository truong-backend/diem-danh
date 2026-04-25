package com.example.diem_danh.service.impl;

import com.example.diem_danh.dto.request.CreateClassRoomRequest;
import com.example.diem_danh.dto.response.ClassRoomResponse;
import com.example.diem_danh.dto.response.UserResponse;
import com.example.diem_danh.exception.AttendanceException;
import com.example.diem_danh.model.node.*;
import com.example.diem_danh.repository.*;
import com.example.diem_danh.service.ChatService;
import com.example.diem_danh.service.ClassRoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClassRoomServiceImpl implements ClassRoomService {

    private final ClassRoomRepository classRoomRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final UserServiceImpl userService;
    private final ChatService chatService;

    @Override
    @Transactional
    public ClassRoomResponse createClassRoom(CreateClassRoomRequest req) {
        CourseNode course = courseRepository.findByCourseId(req.getCourseId())
                .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy môn học"));
        UserNode teacher = userRepository.findByUserId(req.getTeacherId())
                .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy giáo viên"));

        ClassRoomNode cr = ClassRoomNode.builder()
                .classId("CLS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .name(req.getName())
                .semester(req.getSemester())
                .academicYear(req.getAcademicYear())
                .maxStudents(req.getMaxStudents())
                .schedule(req.getSchedule())
                .course(course)
                .teacher(teacher)
                .build();

        ClassRoomNode saved = classRoomRepository.save(cr);

        try {
            chatService.createClassConversation(
                    saved.getClassId(), saved.getName(),
                    teacher.getUserId(), List.of());
        } catch (Exception e) {
            log.warn("Không thể tạo CLASS conversation cho lớp {}: {}", saved.getClassId(), e.getMessage());
        }

        return toResponse(saved);
    }

    @Override
    @Transactional
    public ClassRoomResponse updateClassRoom(String classId, CreateClassRoomRequest req) {
        ClassRoomNode cr = findClass(classId);

        // Cập nhật các trường cơ bản
        cr.setName(req.getName());
        cr.setSemester(req.getSemester());
        cr.setAcademicYear(req.getAcademicYear());
        cr.setMaxStudents(req.getMaxStudents());
        cr.setSchedule(req.getSchedule());

        // Cập nhật môn học nếu thay đổi
        if (req.getCourseId() != null && !req.getCourseId().isBlank()) {
            CourseNode course = courseRepository.findByCourseId(req.getCourseId())
                    .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy môn học"));
            cr.setCourse(course);
        }

        // Cập nhật giáo viên nếu thay đổi
        if (req.getTeacherId() != null && !req.getTeacherId().isBlank()) {
            UserNode teacher = userRepository.findByUserId(req.getTeacherId())
                    .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy giáo viên"));
            cr.setTeacher(teacher);
        }

        return toResponse(classRoomRepository.save(cr));
    }

    @Override
    public ClassRoomResponse getClassRoom(String classId) {
        return toResponse(findClass(classId));
    }

    @Override
    public List<ClassRoomResponse> getAllClassRooms(String userRole, String userId) {
        List<ClassRoomNode> classes;
        if ("ADMIN".equals(userRole)) {
            classes = classRoomRepository.findAllWithDetails();
        } else if ("TEACHER".equals(userRole)) {
            classes = classRoomRepository.findByTeacherId(userId);
        } else {
            classes = classRoomRepository.findByStudentId(userId);
        }
        return classes.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void enrollStudent(String classId, String studentId) {
        findClass(classId);
        userRepository.findByUserId(studentId)
                .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy sinh viên"));
        classRoomRepository.enrollStudent(classId, studentId);
        try {
            chatService.addMemberToClassConversation(classId, studentId);
        } catch (Exception e) {
            log.warn("Không thể thêm SV {} vào conversation lớp {}: {}", studentId, classId, e.getMessage());
        }
    }

    @Override
    @Transactional
    public void unenrollStudent(String classId, String studentId) {
        classRoomRepository.unenrollStudent(classId, studentId);
    }

    @Override
    public List<UserResponse> getStudents(String classId) {
        ClassRoomNode cr = findClass(classId);
        return cr.getStudents().stream().map(userService::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteClassRoom(String classId) {
        ClassRoomNode cr = findClass(classId);
        classRoomRepository.delete(cr);
    }

    private ClassRoomNode findClass(String classId) {
        return classRoomRepository.findByClassId(classId)
                .orElseThrow(() -> AttendanceException.notFound("Không tìm thấy lớp học: " + classId));
    }

    public ClassRoomResponse toResponse(ClassRoomNode cr) {
        ClassRoomResponse.CourseInfo courseInfo = null;
        if (cr.getCourse() != null) {
            courseInfo = ClassRoomResponse.CourseInfo.builder()
                    .courseId(cr.getCourse().getCourseId())
                    .name(cr.getCourse().getName())
                    .code(cr.getCourse().getCode())
                    .credits(cr.getCourse().getCredits())
                    .build();
        }
        ClassRoomResponse.TeacherInfo teacherInfo = null;
        if (cr.getTeacher() != null) {
            teacherInfo = ClassRoomResponse.TeacherInfo.builder()
                    .userId(cr.getTeacher().getUserId())
                    .fullName(cr.getTeacher().getFullName())
                    .email(cr.getTeacher().getEmail())
                    .build();
        }
        Long studentCount = classRoomRepository.countStudentsInClass(cr.getClassId());
        return ClassRoomResponse.builder()
                .id(cr.getId())
                .classId(cr.getClassId())
                .name(cr.getName())
                .semester(cr.getSemester())
                .academicYear(cr.getAcademicYear())
                .maxStudents(cr.getMaxStudents())
                .schedule(cr.getSchedule())
                .course(courseInfo)
                .teacher(teacherInfo)
                .studentCount(studentCount != null ? studentCount.intValue() : 0)
                .build();
    }
}
