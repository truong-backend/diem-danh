import api from './api'
import type { Course } from '../models/classroom.model'
import type { ApiResponse } from '../models/report.model'

export const courseService = {
  async list(): Promise<Course[]> {
    const res = await api.get<ApiResponse<Course[]>>('/courses')
    return res.data.data
  },

  async create(data: { name: string; code: string; credits: number; description?: string }): Promise<Course> {
    const res = await api.post<ApiResponse<Course>>('/courses', data)
    return res.data.data
  },

  // Chỉ gửi name, credits, description - KHÔNG gửi code (BE sẽ báo validation error nếu có code)
  async update(courseId: string, data: { name: string; credits: number; description?: string }): Promise<Course> {
    const res = await api.put<ApiResponse<Course>>(`/courses/${courseId}`, data)
    return res.data.data
  },

  async getOne(courseId: string): Promise<Course> {
    const res = await api.get<ApiResponse<Course>>(`/courses/${courseId}`)
    return res.data.data
  },

  async delete(courseId: string): Promise<void> {
    await api.delete(`/courses/${courseId}`)
  },
}
