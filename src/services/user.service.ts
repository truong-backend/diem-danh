import api from './api'
import type { User } from '../models/user.model'
import type { ApiResponse, PageResponse } from '../models/report.model'

export const userService = {
  async list(params?: { role?: string; search?: string; page?: number; size?: number }) {
    const res = await api.get<ApiResponse<PageResponse<User>>>('/users', { params })
    return res.data.data
  },

  async create(data: Partial<User> & { password: string }) {
    const res = await api.post<ApiResponse<User>>('/users', data)
    return res.data.data
  },

  async update(userId: string, data: Partial<User> & { password?: string }) {
    const res = await api.put<ApiResponse<User>>(`/users/${userId}`, data)
    return res.data.data
  },

  async delete(userId: string) {
    await api.delete(`/users/${userId}`)
  },

  async hardDelete(userId: string) {
    await api.delete(`/users/${userId}`)
  },

  async changeRole(userId: string, role: string) {
    await api.put(`/users/${userId}/role`, { role })
  },

  async getOne(userId: string) {
    const res = await api.get<ApiResponse<User>>(`/users/${userId}`)
    return res.data.data
  },

  async activate(userId: string) {
    await api.put(`/users/${userId}/activate`)
  },

  async deactivateUser(userId: string) {
    await api.put(`/users/${userId}/deactivate`)
  },

  async updateProfile(data: { fullName?: string; phone?: string; password?: string; avatarUrl?: string }) {
    const res = await api.put<ApiResponse<User>>('/users/me/profile', data)
    return res.data.data
  },

  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post<ApiResponse<string>>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },

  async importExcel(file: File): Promise<User[]> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post<ApiResponse<User[]>>('/users/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },
}