package com.example.diem_danh.service;

import com.example.diem_danh.dto.request.CreateClassRoomRequest;
import com.example.diem_danh.dto.response.ClassRoomResponse;
import com.example.diem_danh.dto.response.UserResponse;

import java.util.List;

public interface ClassRoomService {
    ClassRoomResponse createClassRoom(CreateClassRoomRequest req);
    ClassRoomResponse updateClassRoom(String classId, CreateClassRoomRequest req);
    ClassRoomResponse getClassRoom(String classId);
    List<ClassRoomResponse> getAllClassRooms(String userRole, String userId);
    void enrollStudent(String classId, String studentId);
    void unenrollStudent(String classId, String studentId);
    List<UserResponse> getStudents(String classId);
    void deleteClassRoom(String classId);
}
