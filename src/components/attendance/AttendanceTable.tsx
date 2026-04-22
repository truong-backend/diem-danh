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
          <tr className="border-b border-outline-variant/15 bg-surface-container/50">
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">STT</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">MSSV</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Họ tên</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Trạng thái</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Phương thức</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Giờ điểm danh</th>
            {editable && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody>
          {data.map((a, i) => (
            <tr key={a.attendanceId} className="border-b border-outline-variant/10 hover:bg-surface-container-low/60 transition-colors">
              <td className="px-4 py-3 text-on-surface-variant/60">{i + 1}</td>
              <td className="px-4 py-3 font-mono text-xs">{a.student?.studentId || '—'}</td>
              <td className="px-4 py-3 font-medium">{a.student?.fullName}</td>
              <td className="px-4 py-3">
                <StatusBadge status={a.status} />
              </td>
              <td className="px-4 py-3 text-on-surface-variant">
                {a.method === 'QR_CODE' ? '📱 QR Code' : '✍️ Thủ công'}
              </td>
              <td className="px-4 py-3 text-on-surface-variant">
                {a.checkedInAt
                  ? format(new Date(a.checkedInAt), 'HH:mm dd/MM', { locale: vi })
                  : '—'}
              </td>
              {editable && onStatusChange && (
                <td className="px-4 py-3">
                  <select
                    className="text-xs border border-outline-variant/30 rounded-xl px-2 py-1.5 bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary-800/20"
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
              <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant/60">
                Chưa có dữ liệu điểm danh
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}