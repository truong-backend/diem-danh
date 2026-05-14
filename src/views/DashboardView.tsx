import { useAuth } from '../hooks/useAuth'
import { useDashboardViewModel } from '../viewmodels/useDashboardViewModel'
import { AttendanceRateChart } from '../components/attendance/AttendanceRateChart'
import { Skeleton } from '../components/ui/Skeleton'
import StudentDashboardView from './StudentDashboardView'

export default function DashboardView() {
  const { isStudent } = useAuth()
  if (isStudent) return <StudentDashboardView />
  return <AdminTeacherDashboard />
}

function AdminTeacherDashboard() {
  const { user } = useAuth()
  const { stats, loading } = useDashboardViewModel()
  const isAdmin = user?.role === 'ADMIN'

  if (loading) return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  )

  if (!stats) return (
    <div className="p-6">
      <p className="text-center text-[#434654] py-20">Không thể tải dữ liệu dashboard</p>
    </div>
  )

  const statCards = isAdmin
    ? [
        { label: 'Tổng sinh viên',  value: stats.totalStudents,  sub: 'người dùng',      subColor: '#00687b' },
        { label: 'Giảng viên',      value: stats.totalTeachers,  sub: 'đang giảng dạy',  subColor: '#00687b' },
        { label: 'Lớp học',         value: stats.totalClasses,   sub: 'đang hoạt động',  subColor: '#00687b' },
        { label: 'Buổi học',        value: stats.totalSessions,  sub: 'tổng cộng',        subColor: '#434654' },
      ]
    : [
        { label: 'Lớp phụ trách',  value: stats.totalClasses,   sub: 'lớp học',          subColor: '#00687b' },
        { label: 'Sinh viên',      value: stats.totalStudents,  sub: 'tổng cộng',         subColor: '#00687b' },
        { label: 'Buổi học',       value: stats.totalSessions,  sub: 'đã tổ chức',        subColor: '#434654' },
        { label: 'Tỉ lệ điểm danh', value: `${stats.overallAttendanceRate}%`, sub: 'trung bình', subColor: '#0f5132' },
      ]

  return (
    <div className="p-6 space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="page-eyebrow">{isAdmin ? 'Admin Portal' : 'Teacher Portal'}</span>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Tổng quan hệ thống điểm danh</p>
        </div>
      </div>

      {/* ── Bento Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <p className="stat-label">{s.label}</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="stat-value">{s.value}</p>
              <span className="stat-sub mb-1" style={{ color: s.subColor }}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Attendance Rate Hero ── */}
      {isAdmin && (
        <div
          className="relative overflow-hidden rounded-xl p-8 text-white flex items-center gap-6"
          style={{ background: "linear-gradient(135deg, #003d9b 0%, #0052cc 100%)", boxShadow: "0px 2px 4px rgba(0,0,0,0.12)" }}
        >
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-20 pointer-events-none"
               style={{ background: "linear-gradient(to left, #50dcff, transparent)" }} />
          <div className="w-16 h-16 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white" style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}>trending_up</span>
          </div>
          <div className="relative z-10">
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", opacity: 0.8 }}>
              Tỉ lệ điểm danh trung bình
            </p>
            <p style={{ fontSize: 48, fontWeight: 700, lineHeight: "56px", letterSpacing: "-0.02em" }}>
              {stats.overallAttendanceRate}%
            </p>
          </div>
        </div>
      )}

      {/* ── Chart ── */}
      {stats.classStats.length > 0 && (
        <div className="card p-6">
          <h2 style={{ fontSize: 20, fontWeight: 600, lineHeight: "28px" }} className="text-[#191c1e] mb-5">
            Tỉ lệ điểm danh theo lớp
          </h2>
          <AttendanceRateChart data={stats.classStats} />
        </div>
      )}

      {/* ── Detail Table ── */}
      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-[#c3c6d6]/20">
          <h2 style={{ fontSize: 20, fontWeight: 600, lineHeight: "28px" }} className="text-[#191c1e]">
            Chi tiết theo lớp
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Lớp học</th>
                <th>Sinh viên</th>
                <th>Buổi học</th>
                <th>Tỉ lệ</th>
              </tr>
            </thead>
            <tbody>
              {stats.classStats.map(c => {
                const rateBarClass = c.attendanceRate >= 80 ? 'good' : c.attendanceRate >= 60 ? 'warn' : 'bad'
                return (
                  <tr key={c.classId}>
                    <td className="font-semibold text-[#191c1e]">{c.className}</td>
                    <td className="text-[#434654]">{c.totalStudents}</td>
                    <td className="text-[#434654]">{c.totalSessions}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="rate-bar-wrap">
                          <div className={`rate-bar ${rateBarClass}`} style={{ width: `${c.attendanceRate}%` }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600 }} className="text-[#191c1e]">{c.attendanceRate}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {stats.classStats.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-[#434654] py-12">Chưa có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Feature Banner ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          className="md:col-span-2 relative overflow-hidden rounded-xl p-8"
          style={{ background: "linear-gradient(135deg, #003d9b 0%, #0052cc 100%)" }}
        >
          <div className="relative z-10">
            <h3 style={{ fontSize: 20, fontWeight: 600, lineHeight: "28px" }} className="text-white mb-2">
              Tối ưu hóa điểm danh
            </h3>
            <p style={{ fontSize: 14, lineHeight: "20px", opacity: 0.9 }} className="text-white max-w-lg mb-6">
              Tích hợp xác minh sinh trắc học cho các nhóm học từ xa để đảm bảo báo cáo chính xác cao và giảm lỗi nhập thủ công lên đến 40%.
            </p>
            <button className="px-6 py-2 bg-[#50dcff] text-[#003d9b] font-bold rounded-lg hover:opacity-90 transition-all"
                    style={{ fontSize: 12, lineHeight: "16px" }}>
              Nâng cấp tính năng
            </button>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-20 pointer-events-none"
               style={{ background: "linear-gradient(to left, #50dcff, transparent)" }} />
        </div>

        <div className="card p-8 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-[#edeef0] rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[#003d9b]" style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 600, lineHeight: "28px" }} className="text-[#191c1e] mb-1">
            Bộ lọc thông minh
          </h3>
          <p style={{ fontSize: 12, lineHeight: "16px", letterSpacing: "0.01em" }} className="text-[#434654]">
            AI gợi ý bộ lọc dựa trên mẫu báo cáo thường dùng của bạn.
          </p>
        </div>
      </div>

    </div>
  )
}