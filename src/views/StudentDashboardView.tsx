import { useState, useEffect } from 'react'
import { classroomService } from '../services/classroom.service'
import { reportService } from '../services/report.service'
import { useAuth } from '../hooks/useAuth'
import type { ClassRoom } from '../models/classroom.model'
import { Skeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'

interface ClassStat {
  classRoom: ClassRoom
  presentCount: number
  totalSessions: number
  rate: number
}

function rateColor(r: number) {
  if (r >= 80) return '#0f5132'
  if (r >= 60) return '#664d03'
  return '#ba1a1a'
}
function rateBg(r: number) {
  if (r >= 80) return '#d1e7dd'
  if (r >= 60) return '#fff3cd'
  return '#f8d7da'
}
function rateBarColor(r: number) {
  if (r >= 80) return '#0f5132'
  if (r >= 60) return '#664d03'
  return '#ba1a1a'
}
function rateLabel(r: number) {
  if (r >= 80) return 'Tốt'
  if (r >= 60) return 'Cần cố gắng'
  return 'Nguy hiểm'
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
            const rate = total > 0 ? Math.round((present / total) * 100) : 0
            results.push({ classRoom: cr, presentCount: present, totalSessions: total, rate })
          } catch {
            results.push({ classRoom: cr, presentCount: 0, totalSessions: 0, rate: 0 })
          }
        }
        setStats(results)
        setTotalPresent(results.reduce((s, r) => s + r.presentCount, 0))
        setTotalSessions(results.reduce((s, r) => s + r.totalSessions, 0))
      } catch {
        toast.error('Không thể tải thông tin dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const overallRate = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0

  if (loading) return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )

  return (
    <div className="p-4 sm:p-6 space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="page-eyebrow">Student Portal</span>
          <h1 className="page-title">Xin chào, {user?.fullName} 👋</h1>
          <p className="page-subtitle">Tổng quan điểm danh của bạn</p>
        </div>
        {totalSessions > 0 && overallRate < 80 && (
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{ background: '#f8d7da', color: '#842029' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
              warning
            </span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Tỉ lệ điểm danh dưới mức yêu cầu!</span>
          </div>
        )}
      </div>

      {/* ── Bento Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <div className="stat-card">
          <p className="stat-label">Lớp đang học</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="stat-value">{stats.length}</p>
            <span className="stat-sub mb-1" style={{ color: '#00687b' }}>lớp học</span>
          </div>
        </div>
        <div className="stat-card">
          <p className="stat-label">Tổng buổi học</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="stat-value">{totalSessions}</p>
            <span className="stat-sub mb-1" style={{ color: '#434654' }}>buổi</span>
          </div>
        </div>
        <div className="stat-card">
          <p className="stat-label">Đã điểm danh</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="stat-value">{totalPresent}</p>
            <span className="stat-sub mb-1" style={{ color: '#00687b' }}>buổi có mặt</span>
          </div>
        </div>
        <div className="stat-card">
          <p className="stat-label">Tỉ lệ tổng thể</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="stat-value" style={{ color: rateColor(overallRate) }}>{overallRate}%</p>
            <span
              className="stat-sub mb-1 px-2 py-0.5 rounded-full"
              style={{ color: rateColor(overallRate), background: rateBg(overallRate) }}
            >
              {rateLabel(overallRate)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Overall Rate Hero ── */}
      {totalSessions > 0 && (
        <div
          className="relative overflow-hidden rounded-xl p-8 flex items-center gap-6"
          style={{
            background: overallRate >= 80
              ? "linear-gradient(135deg, #003d9b 0%, #0052cc 100%)"
              : overallRate >= 60
              ? "linear-gradient(135deg, #664d03 0%, #997a00 100%)"
              : "linear-gradient(135deg, #842029 0%, #ba1a1a 100%)",
            boxShadow: "0px 2px 4px rgba(0,0,0,0.12)"
          }}
        >
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-20 pointer-events-none"
               style={{ background: "linear-gradient(to left, #50dcff, transparent)" }} />
          <div className="w-16 h-16 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white" style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}>
              {overallRate >= 80 ? 'verified' : overallRate >= 60 ? 'warning' : 'error'}
            </span>
          </div>
          <div className="relative z-10">
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", opacity: 0.8 }} className="text-white">
              Tỉ lệ điểm danh tổng thể
            </p>
            <p style={{ fontSize: 48, fontWeight: 700, lineHeight: "56px", letterSpacing: "-0.02em" }} className="text-white">
              {overallRate}%
            </p>
            <p style={{ fontSize: 14, opacity: 0.85 }} className="text-white mt-1">
              {overallRate >= 80
                ? 'Xuất sắc! Hãy duy trì phong độ này.'
                : overallRate >= 60
                ? 'Cần cố gắng hơn để đạt yêu cầu 80%.'
                : 'Nguy hiểm! Bạn có thể bị cấm thi.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Per-class Table ── */}
      {stats.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-5 border-b border-[#c3c6d6]/20 flex items-center justify-between">
            <h2 style={{ fontSize: 20, fontWeight: 600, lineHeight: "28px" }} className="text-[#191c1e]">
              Chi tiết theo môn học
            </h2>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#434654' }}>{stats.length} lớp học</span>
          </div>
          <div className="overflow-x-auto">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Tên lớp</th>
                  <th>Môn học</th>
                  <th>Giảng viên</th>
                  <th>Buổi có mặt</th>
                  <th>Tỉ lệ</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {stats.map(({ classRoom: cr, presentCount, totalSessions: ts, rate }) => (
                  <tr key={cr.classId}>
                    <td className="font-semibold text-[#191c1e]">{cr.name}</td>
                    <td className="text-[#434654]">{cr.course?.name ?? '—'}</td>
                    <td className="text-[#434654]">{cr.teacher?.fullName ?? '—'}</td>
                    <td className="text-[#434654]">{presentCount}/{ts}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="rate-bar-wrap">
                          <div
                            className="rate-bar"
                            style={{ width: `${rate}%`, background: rateBarColor(rate) }}
                          />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: rateColor(rate) }}>{rate}%</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="px-3 py-1 rounded-full font-bold uppercase tracking-wide"
                        style={{
                          fontSize: 11,
                          color: rateColor(rate),
                          background: rateBg(rate),
                        }}
                      >
                        {rateLabel(rate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-[#edeef0] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[#434654]" style={{ fontSize: 32 }}>schedule</span>
          </div>
          <p style={{ fontSize: 16, fontWeight: 600 }} className="text-[#191c1e] mb-1">Chưa có lớp học nào</p>
          <p style={{ fontSize: 14 }} className="text-[#434654]">Bạn chưa được thêm vào lớp học nào. Vui lòng liên hệ giảng viên.</p>
        </div>
      )}

      {/* ── Pending request banner (student only) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          className="md:col-span-2 relative overflow-hidden rounded-xl p-8"
          style={{ background: "linear-gradient(135deg, #003d9b 0%, #0052cc 100%)" }}
        >
          <div className="relative z-10">
            <h3 style={{ fontSize: 20, fontWeight: 600, lineHeight: "28px" }} className="text-white mb-2">
              Cần xin phép vắng mặt?
            </h3>
            <p style={{ fontSize: 14, lineHeight: "20px", opacity: 0.9 }} className="text-white max-w-lg mb-6">
              Gửi yêu cầu xin phép vắng mặt có lý do để giảng viên duyệt. Buổi vắng có phép sẽ không tính vào tỉ lệ nghỉ học.
            </p>
            <button className="px-6 py-2 bg-[#50dcff] text-[#003d9b] font-bold rounded-lg hover:opacity-90 transition-all"
                    style={{ fontSize: 12, lineHeight: "16px" }}>
              Gửi yêu cầu
            </button>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-20 pointer-events-none"
               style={{ background: "linear-gradient(to left, #50dcff, transparent)" }} />
        </div>

        <div className="card p-8 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-[#edeef0] rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[#003d9b]" style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}>
              qr_code_scanner
            </span>
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 600, lineHeight: "28px" }} className="text-[#191c1e] mb-1">
            Điểm danh QR
          </h3>
          <p style={{ fontSize: 12, lineHeight: "16px", letterSpacing: "0.01em" }} className="text-[#434654]">
            Quét mã QR nhanh chóng để điểm danh không cần giấy tờ.
          </p>
        </div>
      </div>

    </div>
  )
}