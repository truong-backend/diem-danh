/**
 * useTokenExpiry.ts
 * ─────────────────────────────────────────────────────────────
 * Hook lắng nghe sự kiện 'session:expired' (phát từ authTokenService).
 * KHÔNG dùng setInterval — zero polling.
 *
 * Khi mount (user vừa đăng nhập hoặc F5 trang):
 *   → Gọi scheduleRefresh() để đặt setTimeout đúng lúc token sắp hết hạn
 *
 * Khi nhận 'session:expired':
 *   → logout() + toast + redirect /login
 *
 * Khi logout:
 *   → cancelRefreshTimer() để dọn dẹp timer
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import {
  scheduleRefresh,
  cancelRefreshTimer,
  AUTH_EVENTS,
} from '../services/authTokenService'

export function useTokenExpiry() {
  const { accessToken, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  // Đặt timer khi đăng nhập / F5 trang
  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      cancelRefreshTimer()
      return
    }

    scheduleRefresh(accessToken)
  }, [isAuthenticated, accessToken])

  // Lắng nghe sự kiện SESSION_EXPIRED (event-driven, không polling)
  useEffect(() => {
    function handleExpired() {
      const { isAuthenticated: stillAuth } = useAuthStore.getState()
      if (!stillAuth) return

      cancelRefreshTimer()
      logout()

      toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.', {
        id: 'session-expired',
        duration: 4000,
      })
      navigate('/login', { replace: true })
    }

    window.addEventListener(AUTH_EVENTS.EXPIRED, handleExpired)
    return () => window.removeEventListener(AUTH_EVENTS.EXPIRED, handleExpired)
  }, [logout, navigate])
}