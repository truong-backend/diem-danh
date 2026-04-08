import { useParams } from 'react-router-dom'
import { useReportViewModel } from '../viewmodels/useReportViewModel'
import { useSessionViewModel } from '../viewmodels/useSessionViewModel'
import { Download, FileSpreadsheet } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export default function ReportView() {
  const { classId } = useParams<{ classId: string }>()
  const { exportSession, exportClass, loading } = useReportViewModel()
  const { sessions } = useSessionViewModel(classId!)

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Báo cáo & Xuất dữ liệu</h1>
        <p className="text-slate-500 mt-1">Xuất file Excel báo cáo điểm danh</p>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Xuất toàn bộ lớp</h2>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => exportClass(classId!)}
          disabled={loading}
        >
          <FileSpreadsheet className="w-4 h-4" />
          {loading ? 'Đang xuất...' : 'Xuất Excel toàn lớp'}
        </button>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-slate-900">Xuất theo buổi học</h2>
        </div>
        <div className="divide-y">
          {sessions.map(s => (
            <div key={s.sessionId} className="flex items-center px-5 py-3">
              <div className="flex-1">
                <p className="font-medium text-slate-900">Buổi {s.sessionNumber}</p>
                <p className="text-sm text-slate-500">
                  {format(new Date(s.startTime), 'EEEE, dd/MM/yyyy', { locale: vi })}
                  {' · '} {s.room}
                </p>
              </div>
              <button
                className="btn-secondary flex items-center gap-2 text-sm py-1.5"
                onClick={() => exportSession(s.sessionId)}
                disabled={loading}
              >
                <Download className="w-4 h-4" /> Xuất Excel
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="px-5 py-8 text-center text-slate-400">Chưa có buổi học nào</p>
          )}
        </div>
      </div>
    </div>
  )
}