import type { AttendanceStatus } from '../../models/attendance.model'

const map: Record<AttendanceStatus, string> = {
  PRESENT: 'badge-present',
  ABSENT: 'badge-absent',
  LATE: 'badge-late',
  EXCUSED: 'badge-excused',
}

const label: Record<AttendanceStatus, string> = {
  PRESENT: 'Có mặt',
  ABSENT: 'Vắng',
  LATE: 'Muộn',
  EXCUSED: 'Có phép',
}

export function StatusBadge({ status }: { status: AttendanceStatus }) {
  return <span className={map[status]}>{label[status]}</span>
}

export function RoleBadge({ role }: { role: string }) {
  const cls = role === 'ADMIN' ? 'bg-purple-100 text-purple-700'
    : role === 'TEACHER' ? 'bg-blue-100 text-blue-700'
    : 'bg-green-100 text-green-700'
  const lbl = role === 'ADMIN' ? 'Admin' : role === 'TEACHER' ? 'Giáo viên' : 'Sinh viên'
  return <span className={`${cls} px-2 py-0.5 rounded-full text-xs font-medium`}>{lbl}</span>
}