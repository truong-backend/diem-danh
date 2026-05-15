/**
 * authTokenService.ts
 * ─────────────────────────────────────────────────────────────
 * Centralized Auth Service — toàn bộ logic token gom vào đây:
 *   1. Parse exp từ JWT
 *   2. Đặt setTimeout chính xác đến lúc accessToken hết hạn
 *      → 60s trước khi hết hạn: tự động gọi refresh
 *      → Nếu refresh thất bại (refreshToken cũng hết): emit sự kiện SESSION_EXPIRED
 *   3. Event-driven: phát CustomEvent 'session:expired' & 'session:refreshed'
 *      → Mọi component lắng nghe, không ai tự polling
 *   4. Axios interceptor ở tầng API tự gắn Bearer token & xử lý 401
 * ─────────────────────────────────────────────────────────────
 */

import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// ─── Constants ───────────────────────────────────────────────
const REFRESH_BEFORE_MS = 60_000   // Refresh trước khi hết hạn 60s
const BASE_URL = import.meta.env.VITE_API_URL as string

// ─── Events ──────────────────────────────────────────────────
export const AUTH_EVENTS = {
  EXPIRED: 'session:expired',
  REFRESHED: 'session:refreshed',
} as const

function emitExpired() {
  window.dispatchEvent(new CustomEvent(AUTH_EVENTS.EXPIRED))
}

function emitRefreshed() {
  window.dispatchEvent(new CustomEvent(AUTH_EVENTS.REFRESHED))
}

// ─── JWT Helpers ─────────────────────────────────────────────
export function parseJwtExp(token: string | null | undefined): number | null {
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload?.exp ?? null
  } catch {
    return null
  }
}

export function msUntilExpiry(token: string | null | undefined): number {
  const exp = parseJwtExp(token)
  if (!exp) return -1
  return exp * 1000 - Date.now()
}

export function isTokenExpired(token: string | null | undefined): boolean {
  return msUntilExpiry(token) < 10_000   // 10s buffer
}

// ─── Refresh logic (dùng axios thuần, không qua interceptor) ─
let _refreshPromise: Promise<string> | null = null

async function doRefresh(): Promise<string> {
  const { refreshToken, setTokens } = useAuthStore.getState()

  if (!refreshToken || isTokenExpired(refreshToken)) {
    emitExpired()
    throw new Error('refresh_token_expired')
  }

  const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
  const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data
  setTokens(newAccess, newRefresh)
  emitRefreshed()

  // Đặt lại timer cho accessToken mới
  scheduleRefresh(newAccess)

  return newAccess
}

/** Đảm bảo chỉ có 1 request refresh đồng thời */
export function getOrRefresh(): Promise<string> {
  if (!_refreshPromise) {
    _refreshPromise = doRefresh().finally(() => { _refreshPromise = null })
  }
  return _refreshPromise
}

// ─── setTimeout-based scheduler ──────────────────────────────
let _refreshTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Đọc exp trong accessToken, đặt setTimeout đúng 60s trước khi hết hạn.
 * Không polling — chỉ chạy 1 lần rồi tự lập lịch lại sau mỗi lần refresh.
 */
export function scheduleRefresh(accessToken: string | null | undefined) {
  // Hủy timer cũ nếu có
  if (_refreshTimer) {
    clearTimeout(_refreshTimer)
    _refreshTimer = null
  }

  const remaining = msUntilExpiry(accessToken)

  if (remaining <= 0) {
    // accessToken đã hết hạn ngay lúc này → thử refresh ngay
    getOrRefresh().catch(() => {})
    return
  }

  const delay = Math.max(0, remaining - REFRESH_BEFORE_MS)

  _refreshTimer = setTimeout(async () => {
    _refreshTimer = null
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) return

    try {
      await getOrRefresh()
    } catch {
      // doRefresh() đã emit SESSION_EXPIRED
    }
  }, delay)
}

/** Hủy timer (gọi khi logout) */
export function cancelRefreshTimer() {
  if (_refreshTimer) {
    clearTimeout(_refreshTimer)
    _refreshTimer = null
  }
  _refreshPromise = null
}