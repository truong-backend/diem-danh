import { useState } from 'react'
import { reportService } from '../services/report.service'
import toast from 'react-hot-toast'

export function useReportViewModel() {
  const [loading, setLoading] = useState(false)

  const exportSession = async (sessionId: string) => {
    setLoading(true)
    try {
      await reportService.exportSession(sessionId)
      toast.success('Xuất Excel thành công')
    } catch {
      toast.error('Xuất Excel thất bại')
    } finally {
      setLoading(false)
    }
  }

  const exportClass = async (classId: string) => {
    setLoading(true)
    try {
      await reportService.exportClass(classId)
      toast.success('Xuất Excel thành công')
    } catch {
      toast.error('Xuất Excel thất bại')
    } finally {
      setLoading(false)
    }
  }

  return { loading, exportSession, exportClass }
}