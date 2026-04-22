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
        <span className="font-label uppercase tracking-[0.2em] text-[10px] font-bold text-primary-800 block mb-1">Xuất dữ liệu</span>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Báo cáo & Xuất dữ liệu</h1>
        <p className="text-on-surface-variant mt-1 text-sm">Xuất file Excel báo cáo điểm danh</p>
      </div>

      <div className="card p-6">
        <h2 className="font-headline font-bold text-on-surface mb-5 text-lg">Xuất toàn bộ lớp</h2>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => exportClass(classId!)}
          disabled={loading}
        >
          <FileSpreadsheet className="w-4 h-4" />
          {loading ? 'Đang xuất...' : 'Xuất Excel toàn lớp'}
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/15">
          <h2 className="font-headline font-bold text-on-surface text-lg">Xuất theo buổi học</h2>
        </div>
        <div className="divide-y divide-outline-variant/10">
          {sessions.map(s => (
            <div key={s.sessionId} className="flex items-center px-6 py-4 hover:bg-surface-container-low/50 transition-colors">
              <div className="flex-1">
                <p className="font-semibold text-on-surface">Buổi {s.sessionNumber}</p>
                <p className="text-sm text-on-surface-variant mt-0.5">
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
            <p className="px-6 py-10 text-center text-on-surface-variant/60">Chưa có buổi học nào</p>
          )}
        </div>
      </div>
    </div>
  )
}