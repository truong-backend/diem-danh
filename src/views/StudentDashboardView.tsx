import { useState, useEffect } from 'react'
import { classroomService } from '../services/classroom.service'
import { reportService } from '../services/report.service'
import { attendanceService } from '../services/attendance.service'
import { useAuth } from '../hooks/useAuth'
import type { ClassRoom } from '../models/classroom.model'
import { BookOpen, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react'
import { Skeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'

interface ClassStat {
  classRoom: ClassRoom
  presentCount: number
  totalSessions: number
  rate: number
}

export default function StudentDashboardView() {
  const { user } = useAuth()
  const [stats, setStats] = useState<ClassStat[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPresent, setTotalPresent] = useState(0)
  const [totalSessions, setTotalSessions] = useState(0)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const classes = await classroomService.list()
        const results: ClassStat[] = []

        for (const cr of classes) {
          try {
            const data = await reportService.getClassRate(cr.classId) as any
            const sessions = data?.sessions ?? []
            const total = sessions.length
            const present = sessions.reduce(
              (sum: number, s: any) => sum + (Number(s.presentCount) || 0), 0
            )
            // tính tỉ lệ chỉ dựa trên số buổi (1 sinh viên)
            const rate = total > 0 ? Math.round((present / total) * 100) : 0
            results.push({ classRoom: cr, presentCount: present, totalSessions: total, rate })
          } catch {
            results.push({ classRoom: cr, presentCount: 0, totalSessions: 0, rate: 0 })
          }
        }

        setStats(results)
        const tp = results.reduce((s, r) => s + r.presentCount, 0)
        const ts = results.reduce((s, r) => s + r.totalSessions, 0)
        setTotalPresent(tp)
        setTotalSessions(ts)
      } catch {
        toast.error('Không thể tải thông tin dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const overallRate = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0

  const rateColor = (r: number) =>
    r >= 80 ? 'text-green-600' : r >= 60 ? 'text-yellow-600' : 'text-red-600'

  const rateBarColor = (r: number) =>
    r >= 80 ? 'bg-green-500' : r >= 60 ? 'bg-yellow-500' : 'bg-red-500'

  if (loading) return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Xin chào, {user?.fullName} 👋
        </h1>
        <p className="text-slate-500 mt-1">Tổng quan điểm danh của bạn</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-slate-500">Lớp đang học</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.length}</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm text-slate-500">Tổng buổi học</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalSessions}</p>
        </div>

        <div className="card p-5 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-slate-500">Tỉ lệ điểm danh</span>
          </div>
          <p className={`text-3xl font-bold ${rateColor(overallRate)}`}>{overallRate}%</p>
        </div>
      </div>

      {/* Per-class breakdown */}
      {stats.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-slate-900">Chi tiết theo môn học</h2>
          </div>
          <div className="divide-y">
            {stats.map(({ classRoom, presentCount, totalSessions: ts, rate }) => (
              <div key={classRoom.classId} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{classRoom.name}</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {classRoom.course?.name} • {classRoom.semester} {classRoom.academicYear}
                    </p>
                    {classRoom.teacher && (
                      <p className="text-xs text-slate-400 mt-0.5">GV: {classRoom.teacher.fullName}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xl font-bold ${rateColor(rate)}`}>{rate}%</p>
                    <p className="text-xs text-slate-400 mt-0.5">{presentCount}/{ts} buổi</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`${rateBarColor(rate)} h-2 rounded-full transition-all`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
                {rate < 80 && ts > 0 && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Tỉ lệ dưới 80% — cần chú ý điểm danh
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.length === 0 && (
        <div className="card p-12 text-center">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Bạn chưa được thêm vào lớp học nào</p>
        </div>
      )}
    </div>
  )
}