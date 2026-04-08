import { useAuth } from '../hooks/useAuth'
import { useDashboardViewModel } from '../viewmodels/useDashboardViewModel'
import { AttendanceRateChart } from '../components/attendance/AttendanceRateChart'
import { Skeleton } from '../components/ui/Skeleton'
import { Users, BookOpen, GraduationCap, Calendar, TrendingUp } from 'lucide-react'
import StudentDashboardView from './StudentDashboardView'

export default function DashboardView() {
  const { isStudent } = useAuth()
  // Sinh viên dùng view riêng vì backend /reports/dashboard chỉ cho ADMIN/TEACHER
  if (isStudent) return <StudentDashboardView />
  return <AdminTeacherDashboard />
}

function AdminTeacherDashboard() {
  const { stats, loading } = useDashboardViewModel()

  if (loading) return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  )

  if (!stats) return (
    <div className="p-6">
      <p className="text-center text-slate-400 py-20">Không thể tải dữ liệu dashboard</p>
    </div>
  )

  const statCards = [
    { label: 'Sinh viên', value: stats.totalStudents, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Giáo viên', value: stats.totalTeachers, icon: GraduationCap, color: 'text-purple-600 bg-purple-50' },
    { label: 'Lớp học', value: stats.totalClasses, icon: BookOpen, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Buổi học', value: stats.totalSessions, icon: Calendar, color: 'text-orange-600 bg-orange-50' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Tổng quan hệ thống điểm danh</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <span className="text-sm text-slate-500">{s.label}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-5 flex items-center gap-4">
        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
          <TrendingUp className="w-7 h-7 text-green-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500">Tỉ lệ điểm danh trung bình</p>
          <p className="text-4xl font-bold text-green-600">{stats.overallAttendanceRate}%</p>
        </div>
      </div>

      {stats.classStats.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Tỉ lệ điểm danh theo lớp</h2>
          <AttendanceRateChart data={stats.classStats} />
        </div>
      )}

      <div className="card">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-slate-900">Chi tiết theo lớp</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Lớp học</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Sinh viên</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Buổi học</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Tỉ lệ điểm danh</th>
              </tr>
            </thead>
            <tbody>
              {stats.classStats.map(c => (
                <tr key={c.classId} className="border-b hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium">{c.className}</td>
                  <td className="px-5 py-3 text-slate-500">{c.totalStudents}</td>
                  <td className="px-5 py-3 text-slate-500">{c.totalSessions}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${c.attendanceRate}%` }} />
                      </div>
                      <span className="font-medium text-slate-700">{c.attendanceRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {stats.classStats.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">Chưa có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}