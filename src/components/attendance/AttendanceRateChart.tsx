import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { ClassAttendanceStat } from '../../models/report.model'

export function AttendanceRateChart({ data }: { data: ClassAttendanceStat[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e3e5" vertical={false} />
        <XAxis
          dataKey="className"
          tick={{ fontSize: 10, fill: '#434655', fontWeight: 600, fontFamily: 'Public Sans' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: '#434655', fontFamily: 'Public Sans' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          formatter={(v: number) => [`${v}%`, 'Tỉ lệ điểm danh']}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid rgba(195,198,216,0.3)',
            fontSize: 12,
            fontFamily: 'Public Sans',
            boxShadow: '0 12px 40px rgba(25,28,30,0.08)',
            background: '#ffffff',
          }}
          cursor={{ fill: 'rgba(219,225,255,0.3)' }}
        />
        <Bar dataKey="attendanceRate" fill="#0042b3" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}