import { useState, useEffect } from 'react'
import { attendanceService } from '../services/attendance.service'
import type { Attendance, ManualAttendancePayload } from '../models/attendance.model'
import toast from 'react-hot-toast'

export function useAttendanceViewModel(sessionId: string) {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      setAttendance(await attendanceService.bySession(sessionId))
    } catch {
      toast.error('Không thể tải danh sách điểm danh')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [sessionId])

  const saveManual = async (payload: ManualAttendancePayload) => {
    try {
      await attendanceService.checkInManual(payload)
      toast.success('Lưu điểm danh thành công')
      await load()
      return true
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lưu thất bại')
      return false
    }
  }

  const updateStatus = async (attendanceId: string, status: string, note?: string) => {
    try {
      await attendanceService.updateStatus(attendanceId, status, note)
      toast.success('Cập nhật trạng thái thành công')
      await load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại')
    }
  }

  return { attendance, loading, saveManual, updateStatus, reload: load }
}

export function useQrCheckInViewModel() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Attendance | null>(null)

  const checkIn = async (qrToken: string) => {
    setLoading(true)
    try {
      const data = await attendanceService.checkInByQr(qrToken)
      setResult(data)
      toast.success('Điểm danh thành công! ✅')
      return data
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Điểm danh thất bại')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Reset để quét buổi mới
  const reset = () => setResult(null)

  return { loading, result, checkIn, reset }
}