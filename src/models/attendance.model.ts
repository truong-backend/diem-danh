export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
export type AttendanceMethod = 'QR_CODE' | 'MANUAL'

export interface Attendance {
  id?: number
  attendanceId: string
  status: AttendanceStatus
  method: AttendanceMethod
  checkedInAt?: string
  note?: string
  student?: {
    userId: string
    studentId?: string
    fullName: string
    email: string
  }
  session?: {
    sessionId: string
    sessionNumber: number
    startTime: string
    className?: string
  }
}

export interface ManualAttendancePayload {
  sessionId: string
  students: Array<{
    studentId: string
    status: AttendanceStatus
    note?: string
  }>
}