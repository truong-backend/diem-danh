import api from './api'

export interface Notification {
  notificationId: string
  type: string
  title: string
  message: string
  referenceId?: string
  read: boolean
  createdAt: string
}

export const notificationService = {
  list: (page = 0, size = 20): Promise<Notification[]> =>
    api.get('/notifications', { params: { page, size } }).then(r => r.data.data),

  unreadCount: (): Promise<number> =>
    api.get('/notifications/unread-count').then(r => r.data.data.count),

  markAllRead: (): Promise<void> =>
    api.post('/notifications/mark-all-read').then(() => undefined),
}