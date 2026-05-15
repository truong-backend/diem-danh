/**
 * api.ts
 * ─────────────────────────────────────────────────────────────
 * Axios instance với 2 interceptor:
 *
 * REQUEST:
 *   - Gắn Bearer token vào mọi request
 *   - Nếu accessToken đã hết hạn nhưng refreshToken còn → refresh trước rồi gửi
 *   - Nếu cả 2 hết hạn → emit SESSION_EXPIRED, reject
 *
 * RESPONSE:
 *   - Bắt 401 → thử refresh rồi retry request gốc (queue các request chờ)
 *   - Refresh thất bại → emit SESSION_EXPIRED, reject
 * ─────────────────────────────────────────────────────────────
 */

import axios, { AxiosError } from 'axios'
import { useAuthStore } from '../store/authStore'
import {
  isTokenExpired,
  getOrRefresh,
  AUTH_EVENTS,
} from './authTokenService'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ─── Request interceptor ──────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const { accessToken, refreshToken, isAuthenticated } = useAuthStore.getState()

  // Chưa đăng nhập → gửi bình thường (login, forgot-password...)
  if (!isAuthenticated || !accessToken) return config

  // accessToken còn hạn → gắn vào header luôn
  if (!isTokenExpired(accessToken)) {
    config.headers.Authorization = `Bearer ${accessToken}`
    return config
  }

  // accessToken hết hạn, thử refresh bằng refreshToken
  if (refreshToken && !isTokenExpired(refreshToken)) {
    try {
      const newAccess = await getOrRefresh()
      config.headers.Authorization = `Bearer ${newAccess}`
      return config
    } catch {
      // Refresh thất bại → emit expired (authTokenService đã emit)
      return Promise.reject(new axios.Cancel('SESSION_EXPIRED'))
    }
  }

  // Cả 2 đều hết hạn → emit và dừng
  window.dispatchEvent(new CustomEvent(AUTH_EVENTS.EXPIRED))
  return Promise.reject(new axios.Cancel('SESSION_EXPIRED'))
})

// ─── Response interceptor — xử lý 401 từ server ──────────────
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token!)
  )
  pendingQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any

    // Không phải 401 hoặc đã retry → pass thẳng
    if (error.response?.status !== 401 || original?._retry) {
      return Promise.reject(error)
    }

    // Đang refresh → xếp hàng chờ
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) return Promise.reject(error)

    original._retry = true

    return new Promise((resolve, reject) => {
      pendingQueue.push({
        resolve: (token) => {
          original.headers.Authorization = `Bearer ${token}`
          resolve(api(original))
        },
        reject,
      })

      getOrRefresh()
        .then((token) => processQueue(null, token))
        .catch((err) => {
          processQueue(err, null)
          // authTokenService đã emit SESSION_EXPIRED
        })
    })
  }
)

export default api