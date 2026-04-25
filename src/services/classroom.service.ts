import api from './api'
import type { ClassRoom, Course, CreateClassRoomPayload } from '../models/classroom.model'
import type { User } from '../models/user.model'
import type { ApiResponse } from '../models/report.model'

export const classroomService = {
  async list(): Promise<ClassRoom[]> {
    const res = await api.get<ApiResponse<ClassRoom[]>>('/classrooms')
    return res.data.data
  },

  async create(data: CreateClassRoomPayload): Promise<ClassRoom> {
    const res = await api.post<ApiResponse<ClassRoom>>('/classrooms', data)
    return res.data.data
  },

  async update(classId: string, data: CreateClassRoomPayload): Promise<ClassRoom> {
    const res = await api.put<ApiResponse<ClassRoom>>(`/classrooms/${classId}`, data)
    return res.data.data
  },

  async getOne(classId: string): Promise<ClassRoom> {
    const res = await api.get<ApiResponse<ClassRoom>>(`/classrooms/${classId}`)
    return res.data.data
  },

  async delete(classId: string): Promise<void> {
    await api.delete(`/classrooms/${classId}`)
  },

  async getStudents(classId: string): Promise<User[]> {
    const res = await api.get<ApiResponse<User[]>>(`/classrooms/${classId}/students`)
    return res.data.data
  },

  async enroll(classId: string, studentId: string): Promise<void> {
    await api.post(`/classrooms/${classId}/enroll`, { studentId })
  },

  async unenroll(classId: string, studentId: string): Promise<void> {
    await api.delete(`/classrooms/${classId}/enroll/${studentId}`)
  },

  async getCourses(): Promise<Course[]> {
    const res = await api.get<ApiResponse<Course[]>>('/courses')
    return res.data.data
  },
}
