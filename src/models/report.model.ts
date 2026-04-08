export interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalSessions: number
  overallAttendanceRate: number
  classStats: ClassAttendanceStat[]
  weeklyTrend: Array<{ date: string; rate: number }>
}

export interface ClassAttendanceStat {
  classId: string
  className: string
  attendanceRate: number
  totalSessions: number
  totalStudents: number
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}