import type { User } from '../../models/user.model'
import type { AttendanceStatus } from '../../models/attendance.model'
import { useState } from 'react'

interface StudentRow {
  userId: string
  studentId?: string
  fullName: string
  status: AttendanceStatus
  note: string
}

interface Props {
  students: User[]
  sessionId: string
  onSubmit: (rows: StudentRow[]) => void
  loading?: boolean
}

export function ManualCheckInForm({ students, sessionId, onSubmit, loading }: Props) {
  const [rows, setRows] = useState<StudentRow[]>(
    students.map(s => ({ userId: s.userId, studentId: s.studentId, fullName: s.fullName, status: 'PRESENT', note: '' }))
  )

  const update = (idx: number, field: keyof StudentRow, value: string) => {
    setRows(r => r.map((row, i) => i === idx ? { ...row, [field]: value } : row))
  }

  const handleSubmit = () => onSubmit(rows)

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b">
              <th className="text-left px-3 py-2 text-slate-500">MSSV</th>
              <th className="text-left px-3 py-2 text-slate-500">Họ tên</th>
              <th className="text-left px-3 py-2 text-slate-500">Trạng thái</th>
              <th className="text-left px-3 py-2 text-slate-500">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.userId} className="border-b">
                <td className="px-3 py-2 font-mono text-xs">{row.studentId}</td>
                <td className="px-3 py-2">{row.fullName}</td>
                <td className="px-3 py-2">
                  <select
                    className="text-xs border rounded px-2 py-1"
                    value={row.status}
                    onChange={e => update(i, 'status', e.target.value)}
                  >
                    <option value="PRESENT">Có mặt</option>
                    <option value="ABSENT">Vắng</option>
                    <option value="LATE">Muộn</option>
                    <option value="EXCUSED">Có phép</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    className="text-xs border rounded px-2 py-1 w-full"
                    placeholder="Ghi chú..."
                    value={row.note}
                    onChange={e => update(i, 'note', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-3">
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Đang lưu...' : 'Lưu điểm danh'}
        </button>
      </div>
    </div>
  )
}