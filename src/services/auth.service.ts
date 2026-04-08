import api from './api'
import type { AuthTokens, LoginCredentials } from '../models/user.model'
import type { ApiResponse } from '../models/report.model'

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const res = await api.post<ApiResponse<AuthTokens>>('/auth/login', credentials)
    return res.data.data
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken })
  },
}