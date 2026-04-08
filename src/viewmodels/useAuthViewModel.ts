import { useState } from 'react'
import { authService } from '../services/auth.service'
import { useAuthStore } from '../store/authStore'
import type { LoginCredentials } from '../models/user.model'
import toast from 'react-hot-toast'

export function useAuthViewModel() {
  const [loading, setLoading] = useState(false)
  const { setAuth, logout: storeLogout, refreshToken } = useAuthStore()

  const login = async (credentials: LoginCredentials) => {
    setLoading(true)
    try {
      const data = await authService.login(credentials)
      setAuth(data.user, data.accessToken, data.refreshToken)
      toast.success(`Chào mừng ${data.user.fullName}!`)
      return true
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại')
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      if (refreshToken) await authService.logout(refreshToken)
    } finally {
      storeLogout()
    }
  }

  return { login, logout, loading }
}