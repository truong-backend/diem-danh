import axios, { AxiosError } from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Parse JWT payload không cần thư viện ngoài */
function parseJwtExp(token: string | null | undefined): number | null {
  if (!token) return null
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    return payload?.exp ?? null
  } catch {
    return null
  }
}

function isTokenExpired(token: string | null | undefined): boolean {
  const exp = parseJwtExp(token)
  if (!exp) return true
  return exp * 1000 < Date.now() + 10_000   // 10s buffer
}

// ── Request interceptor — attach JWT, check expiry proactively ────────────────
api.interceptors.request.use((config) => {
  const { accessToken, refreshToken, logout } = useAuthStore.getState()

  // Nếu cả 2 token đều hết hạn → logout ngay, không gửi request nữa
  if (isTokenExpired(accessToken) && isTokenExpired(refreshToken)) {
    logout()
    return Promise.reject(new axios.Cancel('SESSION_EXPIRED'))
  }

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// ── Response interceptor — handle 401, refresh token ─────────────────────────
let isRefreshing = false
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  pendingQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    // Nếu đang refresh, xếp hàng chờ
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          },
          reject,
        })
      })
    }

    original._retry = true
    isRefreshing = true

    const { refreshToken, logout, setTokens } = useAuthStore.getState()

    // Nếu không có refresh token hoặc refresh token đã hết hạn → logout
    if (!refreshToken || isTokenExpired(refreshToken)) {
      isRefreshing = false
      processQueue(error, null)
      logout()
      return Promise.reject(error)
    }

    try {
      // Gọi refresh — dùng axios thuần với baseURL đầy đủ để tránh vòng lặp interceptor
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        { refreshToken }
      )
      const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data
      setTokens(newAccess, newRefresh)
      original.headers.Authorization = `Bearer ${newAccess}`
      processQueue(null, newAccess)
      return api(original)
    } catch (refreshError) {
      processQueue(refreshError, null)
      logout()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api