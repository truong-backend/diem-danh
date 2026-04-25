import { useState, useEffect, useRef } from 'react'
import { sessionService } from '../services/session.service'
import type { Session, CreateSessionPayload, QrData } from '../models/session.model'
import toast from 'react-hot-toast'

export function useSessionViewModel(classId: string) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!classId) return
    setLoading(true)
    try {
      setSessions(await sessionService.list(classId))
    } catch {
      toast.error('Không thể tải danh sách buổi học')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (classId) load() }, [classId])

  const createSession = async (data: CreateSessionPayload) => {
    try {
      await sessionService.create(classId, data)
      toast.success('Tạo buổi học thành công')
      await load()
      return true
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Tạo buổi học thất bại')
      return false
    }
  }

  const updateSession = async (sessionId: string, data: CreateSessionPayload) => {
    try {
      await sessionService.update(sessionId, data)
      toast.success('Cập nhật buổi học thành công')
      await load()
      return true
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cập nhật buổi học thất bại')
      return false
    }
  }

  const deleteSession = async (sessionId: string) => {
    if (!window.confirm('Xác nhận xóa buổi học? Toàn bộ dữ liệu điểm danh của buổi này cũng sẽ bị xóa.')) return false
    try {
      await sessionService.delete(sessionId)
      toast.success('Đã xóa buổi học')
      await load()
      return true
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Xóa buổi học thất bại')
      return false
    }
  }

  return { sessions, loading, createSession, updateSession, deleteSession, reload: load }
}

export function useQrViewModel(sessionId: string) {
  const [qrData, setQrData] = useState<QrData | null>(null)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Lưu deadline tuyệt đối (ms) để countdown không bị lệch timezone
  const deadlineRef = useRef<number>(0)

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  /**
   * Nhận expiresInSeconds từ BE (luôn chính xác, không phụ thuộc timezone).
   * Tính deadline = now + seconds, rồi đếm ngược từ đó.
   */
  const startCountdownFromSeconds = (seconds: number) => {
    clearTimer()
    deadlineRef.current = Date.now() + seconds * 1000
    const tick = () => {
      const remaining = Math.max(0, Math.floor((deadlineRef.current - Date.now()) / 1000))
      setCountdown(remaining)
      if (remaining === 0) clearTimer()
    }
    tick()
    timerRef.current = setInterval(tick, 1000)
  }

  useEffect(() => () => clearTimer(), [])

  const generateQr = async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const data = await sessionService.generateQr(sessionId)
      setQrData(data)
      // Dùng expiresInSeconds (BE trả về chính xác, không bị lệch timezone)
      if (data.expiresInSeconds && data.expiresInSeconds > 0) {
        startCountdownFromSeconds(data.expiresInSeconds)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Tạo QR thất bại')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Mở modal: thử load QR đang active.
   * Nếu còn hợp lệ → hiển thị và chạy đồng hồ.
   * Nếu hết hạn / không có → tự động tạo mới.
   */
  const loadExistingQr = async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const data = await sessionService.getQr(sessionId)
      if (data?.qrImageBase64 && data.expiresInSeconds != null && data.expiresInSeconds > 0) {
        setQrData(data)
        startCountdownFromSeconds(data.expiresInSeconds)
        setLoading(false)
        return
      }
      // QR hết hạn hoặc không hợp lệ → tạo mới
      await generateQr()
    } catch {
      // Không có QR hợp lệ → tạo mới ngay
      await generateQr()
    } finally {
      setLoading(false)
    }
  }

  return { qrData, loading, countdown, generateQr, loadExistingQr }
}
