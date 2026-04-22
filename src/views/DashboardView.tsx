import { useAuth } from '../hooks/useAuth'
import { useDashboardViewModel } from '../viewmodels/useDashboardViewModel'
import { AttendanceRateChart } from '../components/attendance/AttendanceRateChart'
import { Skeleton } from '../components/ui/Skeleton'
import { Users, BookOpen, GraduationCap, Calendar, TrendingUp } from 'lucide-react'
import StudentDashboardView from './StudentDashboardView'

export default function DashboardView() {
  const { isStudent } = useAuth()
  if (isStudent) return <StudentDashboardView />
  return <AdminTeacherDashboard />
}

function AdminTeacherDashboard() {
  const { stats, loading } = useDashboardViewModel()

  if (loading) return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  )

  if (!stats) return (
    <div className="p-6">
      <p className="text-center text-on-surface-variant py-20">Không thể tải dữ liệu dashboard</p>
    </div>
  )

  const statCards = [
    { label: 'Sinh viên', value: stats.totalStudents, icon: Users, colorIcon: 'text-primary-700', colorBg: 'bg-primary-100' },
    { label: 'Giáo viên', value: stats.totalTeachers, icon: GraduationCap, colorIcon: 'text-purple-600', colorBg: 'bg-purple-100' },
    { label: 'Lớp học', value: stats.totalClasses, icon: BookOpen, colorIcon: 'text-emerald-600', colorBg: 'bg-emerald-100' },
    { label: 'Buổi học', value: stats.totalSessions, icon: Calendar, colorIcon: 'text-orange-600', colorBg: 'bg-orange-100' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <header>
        <span className="font-label uppercase tracking-[0.2em] text-[10px] font-bold text-primary-800 block mb-1">Admin Portal</span>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Dashboard</h1>
        <p className="text-on-surface-variant mt-1 text-sm">Tổng quan hệ thống điểm danh</p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${s.colorBg}`}>
                <s.icon className={`w-5 h-5 ${s.colorIcon}`} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{s.label}</span>
            </div>
            <p className="text-4xl font-headline font-black text-on-surface">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Attendance rate hero */}
      <div className="card p-6 flex items-center gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 primary-gradient rounded-full blur-3xl opacity-5 pointer-events-none" />
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Tỉ lệ điểm danh trung bình</p>
          <p className="font-headline text-5xl font-black text-emerald-600">{stats.overallAttendanceRate}%</p>
        </div>
      </div>

      {/* Chart */}
      {stats.classStats.length > 0 && (
        <div className="card p-6">
          <h2 className="font-headline font-headline font-bold text-on-surface mb-5 text-lg">Tỉ lệ điểm danh theo lớp</h2>
          <AttendanceRateChart data={stats.classStats} />
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/15">
          <h2 className="font-headline font-headline font-bold text-on-surface text-lg">Chi tiết theo lớp</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/15 bg-surface-container/50">
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Lớp học</th>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Sinh viên</th>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Buổi học</th>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Tỉ lệ</th>
              </tr>
            </thead>
            <tbody>
              {stats.classStats.map(c => (
                <tr key={c.classId} className="border-b border-outline-variant/10 hover:bg-surface-container/30 transition-colors">
                  <td className="px-6 py-4 font-semibold text-on-surface">{c.className}</td>
                  <td className="px-6 py-4 text-on-surface-variant">{c.totalStudents}</td>
                  <td className="px-6 py-4 text-on-surface-variant">{c.totalSessions}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-surface-container-high rounded-full h-2">
                        <div className="bg-primary-800 h-2 rounded-full" style={{ width: `${c.attendanceRate}%` }} />
                      </div>
                      <span className="font-headline font-bold text-on-surface">{c.attendanceRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {stats.classStats.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-on-surface-variant">Chưa có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}