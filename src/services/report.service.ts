import api from './api'
import type { DashboardStats, ApiResponse } from '../models/report.model'

export const reportService = {
  async getDashboard(): Promise<DashboardStats> {
    const res = await api.get<ApiResponse<DashboardStats>>('/reports/dashboard')
    return res.data.data
  },

  async getClassRate(classId: string): Promise<any> {
    const res = await api.get(`/reports/classrooms/${classId}/rate`)
    return res.data.data
  },

  async exportSession(sessionId: string): Promise<void> {
    const res = await api.get(`/reports/sessions/${sessionId}/export`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_${sessionId}.xlsx`
    a.click()
  },

  async exportClass(classId: string): Promise<void> {
    const res = await api.get(`/reports/classrooms/${classId}/export`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `class_${classId}.xlsx`
    a.click()
  },
}