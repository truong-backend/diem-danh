import api from './api'
import type { Attendance, ManualAttendancePayload } from '../models/attendance.model'
import type { ApiResponse } from '../models/report.model'

export const attendanceService = {
  async checkInByQr(qrToken: string): Promise<Attendance> {
    const res = await api.post<ApiResponse<Attendance>>('/attendance/qr', { qrToken })
    return res.data.data
  },

  async checkInManual(data: ManualAttendancePayload): Promise<Attendance[]> {
    const res = await api.post<ApiResponse<Attendance[]>>('/attendance/manual', data)
    return res.data.data
  },

  async bySession(sessionId: string): Promise<Attendance[]> {
    const res = await api.get<ApiResponse<Attendance[]>>(`/attendance/sessions/${sessionId}`)
    return res.data.data
  },

  async updateStatus(attendanceId: string, status: string, note?: string): Promise<Attendance> {
    const res = await api.put<ApiResponse<Attendance>>(`/attendance/${attendanceId}/status`, { status, note })
    return res.data.data
  },

  async studentHistory(studentId: string): Promise<Attendance[]> {
    const res = await api.get<ApiResponse<Attendance[]>>(`/attendance/students/${studentId}`)
    return res.data.data
  },
}