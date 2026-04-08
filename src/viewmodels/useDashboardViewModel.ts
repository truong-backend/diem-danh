import { useState, useEffect } from 'react'
import { reportService } from '../services/report.service'
import type { DashboardStats } from '../models/report.model'
import toast from 'react-hot-toast'

export function useDashboardViewModel() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await reportService.getDashboard()
      setStats(data)
    } catch {
      toast.error('Không thể tải dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return { stats, loading, reload: load }
}