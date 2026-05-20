import { useState, useEffect } from 'react'
import { classroomService } from '../services/classroom.service'
import { sessionService } from '../services/session.service'
import { useAuth } from '../hooks/useAuth'
import type { ClassRoom } from '../models/classroom.model'
import type { Session } from '../models/session.model'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns'
import { vi } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface SessionWithClass extends Session { className: string; classId: string }
const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']

export default function TimetableView() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [sessions, setSessions] = useState<SessionWithClass[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const classes: ClassRoom[] = await classroomService.list()
        const all: SessionWithClass[] = []
        for (const cr of classes) {
          try { const ss = await sessionService.list(cr.classId); ss.forEach(s => all.push({ ...s, className: cr.name, classId: cr.classId })) }
          catch { /* skip */ }
        }
        setSessions(all)
      } catch { toast.error('Không thể tải thời khóa biểu') } finally { setLoading(false) }
    }
    load()
  }, [])

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const getSessionsForDay = (day: Date) =>
    sessions.filter(s => isSameDay(new Date(s.startTime), day))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  const goToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const isCurrentWeek = isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 }))

  const statusColor = (s: SessionWithClass) => {
    const now = new Date(), start = new Date(s.startTime), end = new Date(s.endTime)
    if (now >= start && now <= end) return 'bg-green-100 border-green-400 text-green-800'
    if (now > end) return 'bg-surface-container border-outline-variant/30 text-on-surface-variant'
    return 'bg-primary-100 border-blue-300 text-blue-800'
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <span className="font-label uppercase tracking-[0.2em] text-[10px] font-bold text-primary-800 block mb-1">Lịch học</span>
          <h1 className="font-headline text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">Thời khóa biểu</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Lịch học theo tuần</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isCurrentWeek && (
            <button onClick={goToday} className="border border-primary-800/30 rounded-xl px-3 py-1.5 text-sm font-semibold text-primary-800 hover:bg-primary-100 transition-colors">
              Tuần này
            </button>
          )}
          <div className="flex items-center gap-1">
            <button onClick={() => setWeekStart(w => subWeeks(w, 1))} className="p-2 rounded-xl border border-outline-variant/30 hover:bg-surface-container transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-on-surface px-2 whitespace-nowrap">
              {format(weekStart, 'dd/MM', { locale: vi })} — {format(addDays(weekStart, 6), 'dd/MM/yyyy', { locale: vi })}
            </span>
            <button onClick={() => setWeekStart(w => addWeeks(w, 1))} className="p-2 rounded-xl border border-outline-variant/30 hover:bg-surface-container transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <>
          {/* Mobile skeleton */}
          <div className="space-y-3 sm:hidden">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-surface-container rounded-2xl animate-pulse" />)}
          </div>
          {/* Desktop skeleton */}
          <div className="hidden sm:grid grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-64 bg-surface-container rounded-2xl animate-pulse" />)}
          </div>
        </>
      ) : (
        <>
          {/* ── Mobile: list view (< sm) ── */}
          <div className="sm:hidden space-y-3">
            {weekDays.map((day, idx) => {
              const daySessions = getSessionsForDay(day)
              const isToday = isSameDay(day, new Date())
              if (daySessions.length === 0 && !isToday) return null
              return (
                <div key={idx} className={`rounded-2xl overflow-hidden border ${isToday ? 'border-primary-800/30' : 'border-outline-variant/20'}`}>
                  <div className={`px-4 py-2.5 flex items-center gap-3 ${isToday ? 'bg-primary-800 text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                    <span className="text-sm font-semibold">{DAYS[idx]}</span>
                    <span className={`text-sm font-bold ${isToday ? 'text-white' : 'text-on-surface'}`}>{format(day, 'dd/MM', { locale: vi })}</span>
                    {isToday && <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">Hôm nay</span>}
                  </div>
                  {daySessions.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-on-surface-variant/50 italic">Không có buổi học</div>
                  ) : (
                    <div className="divide-y divide-outline-variant/10">
                      {daySessions.map(s => (
                        <div key={s.sessionId} className={`px-4 py-3 border-l-4 ${statusColor(s)}`}>
                          <p className="font-semibold text-sm">{s.className}</p>
                          <p className="text-xs mt-0.5 opacity-80">
                            {format(new Date(s.startTime), 'HH:mm')}–{format(new Date(s.endTime), 'HH:mm')}
                            {s.room && ` · ${s.room}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {weekDays.every(day => getSessionsForDay(day).length === 0) && (
              <div className="card p-8 text-center text-on-surface-variant/60 text-sm">Không có buổi học trong tuần này</div>
            )}
          </div>

          {/* ── Desktop: 7-column grid (≥ sm) ── */}
          <div className="hidden sm:grid grid-cols-7 gap-2 lg:gap-3">
            {weekDays.map((day, idx) => {
              const daySessions = getSessionsForDay(day)
              const isToday = isSameDay(day, new Date())
              return (
                <div key={idx} className="min-h-[200px]">
                  <div className={`text-center py-2 mb-2 rounded-xl ${isToday ? 'bg-primary-800 text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                    <p className="text-xs font-medium">{DAYS[idx]}</p>
                    <p className={`text-lg font-bold ${isToday ? 'text-white' : 'text-on-surface'}`}>{format(day, 'd')}</p>
                  </div>
                  <div className="space-y-2">
                    {daySessions.length === 0 ? (
                      <div className="text-center text-on-surface-variant/40 text-xs py-4">—</div>
                    ) : daySessions.map(s => (
                      <div key={s.sessionId} className={`border rounded-xl px-2 py-1.5 text-xs ${statusColor(s)}`}>
                        <p className="font-semibold truncate">{s.className}</p>
                        <p className="mt-0.5 opacity-80">{format(new Date(s.startTime), 'HH:mm')}–{format(new Date(s.endTime), 'HH:mm')}</p>
                        {s.room && <p className="opacity-70 truncate">{s.room}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-on-surface-variant pt-2">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-200 border border-green-400 inline-block"></span> Đang diễn ra</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary-100 border border-blue-300 inline-block"></span> Sắp tới</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-surface-container border border-outline-variant/30 inline-block"></span> Đã qua</span>
      </div>
    </div>
  )
}
