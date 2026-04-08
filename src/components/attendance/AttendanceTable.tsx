import type { Attendance, AttendanceStatus } from '../../models/attendance.model'
import { StatusBadge } from '../ui/Badge'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Props {
  data: Attendance[]
  onStatusChange?: (attendanceId: string, status: AttendanceStatus) => void
  editable?: boolean
}

export function AttendanceTable({ data, onStatusChange, editable }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-slate-50">
            <th className="text-left px-4 py-3 text-slate-500 font-medium">STT</th>
            <th className="text-left px-4 py-3 text-slate-500 font-medium">MSSV</th>
            <th className="text-left px-4 py-3 text-slate-500 font-medium">Họ tên</th>
            <th className="text-left px-4 py-3 text-slate-500 font-medium">Trạng thái</th>
            <th className="text-left px-4 py-3 text-slate-500 font-medium">Phương thức</th>
            <th className="text-left px-4 py-3 text-slate-500 font-medium">Giờ điểm danh</th>
            {editable && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody>
          {data.map((a, i) => (
            <tr key={a.attendanceId} className="border-b hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 text-slate-400">{i + 1}</td>
              <td className="px-4 py-3 font-mono text-xs">{a.student?.studentId || '—'}</td>
              <td className="px-4 py-3 font-medium">{a.student?.fullName}</td>
              <td className="px-4 py-3">
                <StatusBadge status={a.status} />
              </td>
              <td className="px-4 py-3 text-slate-500">
                {a.method === 'QR_CODE' ? '📱 QR Code' : '✍️ Thủ công'}
              </td>
              <td className="px-4 py-3 text-slate-500">
                {a.checkedInAt
                  ? format(new Date(a.checkedInAt), 'HH:mm dd/MM', { locale: vi })
                  : '—'}
              </td>
              {editable && onStatusChange && (
                <td className="px-4 py-3">
                  <select
                    className="text-xs border rounded px-2 py-1"
                    value={a.status}
                    onChange={e => onStatusChange(a.attendanceId, e.target.value as AttendanceStatus)}
                  >
                    <option value="PRESENT">Có mặt</option>
                    <option value="ABSENT">Vắng</option>
                    <option value="LATE">Muộn</option>
                    <option value="EXCUSED">Có phép</option>
                  </select>
                </td>
              )}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                Chưa có dữ liệu điểm danh
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}