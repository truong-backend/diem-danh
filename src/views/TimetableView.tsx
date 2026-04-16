import { useState, useEffect } from 'react'
import { classroomService } from '../services/classroom.service'
import { sessionService } from '../services/session.service'
import { useAuth } from '../hooks/useAuth'
import type { ClassRoom } from '../models/classroom.model'
import type { Session } from '../models/session.model'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns'
import { vi } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface SessionWithClass extends Session {
  className: string
  classId: string
}

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']

export default function TimetableView() {
  const { user } = useAuth()
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
          try {
            const ss = await sessionService.list(cr.classId)
            ss.forEach(s => all.push({ ...s, className: cr.name, classId: cr.classId }))
          } catch { /* skip */ }
        }
        setSessions(all)
      } catch {
        toast.error('Không thể tải thời khóa biểu')
      } finally {
        setLoading(false)
      }
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
    const now = new Date()
    const start = new Date(s.startTime)
    const end = new Date(s.endTime)
    if (now >= start && now <= end) return 'bg-green-100 border-green-400 text-green-800'
    if (now > end) return 'bg-slate-100 border-slate-300 text-slate-500'
    return 'bg-blue-50 border-blue-300 text-blue-800'
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Thời khóa biểu</h1>
          <p className="text-slate-500 mt-1">Lịch học theo tuần</p>
        </div>
        <div className="flex items-center gap-2">
          {!isCurrentWeek && (
            <button onClick={goToday}
              className="border rounded-xl px-3 py-1.5 text-sm text-blue-600 border-blue-200 hover:bg-blue-50">
              Tuần này
            </button>
          )}
          <button onClick={() => setWeekStart(w => subWeeks(w, 1))}
            className="p-2 rounded-lg border hover:bg-slate-50">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-slate-700 min-w-[200px] text-center">
            {format(weekStart, 'dd/MM', { locale: vi })} — {format(addDays(weekStart, 6), 'dd/MM/yyyy', { locale: vi })}
          </span>
          <button onClick={() => setWeekStart(w => addWeeks(w, 1))}
            className="p-2 rounded-lg border hover:bg-slate-50">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-3">
          {weekDays.map((day, idx) => {
            const daySessions = getSessionsForDay(day)
            const isToday = isSameDay(day, new Date())
            return (
              <div key={idx} className="min-h-[200px]">
                {/* Day header */}
                <div className={`text-center py-2 mb-2 rounded-lg ${isToday ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <p className="text-xs font-medium">{DAYS[idx]}</p>
                  <p className={`text-lg font-bold ${isToday ? 'text-white' : 'text-slate-900'}`}>
                    {format(day, 'd')}
                  </p>
                </div>
                {/* Sessions */}
                <div className="space-y-2">
                  {daySessions.length === 0 ? (
                    <div className="text-center text-slate-300 text-xs py-4">—</div>
                  ) : daySessions.map(s => (
                    <div key={s.sessionId}
                      className={`border rounded-lg px-2 py-1.5 text-xs ${statusColor(s)}`}>
                      <p className="font-semibold truncate">{s.className}</p>
                      <p className="mt-0.5 opacity-80">
                        {format(new Date(s.startTime), 'HH:mm')}–{format(new Date(s.endTime), 'HH:mm')}
                      </p>
                      {s.room && <p className="opacity-70 truncate">{s.room}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-200 border border-green-400 inline-block"></span> Đang diễn ra
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300 inline-block"></span> Sắp tới
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300 inline-block"></span> Đã qua
        </span>
      </div>
    </div>
  )
}