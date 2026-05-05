import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

function parseJwtExp(token: string | null | undefined): number | null {
  if (!token) return null
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))?.exp ?? null
  } catch {
    return null
  }
}

function isBothExpired(access: string | null, refresh: string | null): boolean {
  const isExpired = (t: string | null) => {
    const exp = parseJwtExp(t)
    return !exp || exp * 1000 < Date.now() + 10_000
  }
  return isExpired(access) && isExpired(refresh)
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, accessToken, refreshToken, logout } = useAuthStore()

  // Đã login nhưng cả 2 token hết hạn → force logout, redirect về login
  if (isAuthenticated && isBothExpired(accessToken, refreshToken)) {
    logout()
    return <Navigate to="/login" replace />
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}