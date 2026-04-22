import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCheck } from 'lucide-react'
import { notificationService, type Notification } from '../../services/notification.service'
import { useAuthStore } from '../../store/authStore'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws'

export default function NotificationBell() {
  const { user, accessToken } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load ban đầu
  useEffect(() => {
    if (!user) return
    notificationService.unreadCount().then(setUnread).catch(() => {})
  }, [user])

  // Subscribe WS realtime
  useEffect(() => {
    if (!accessToken || !user) return
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
    })
    client.onConnect = () => {
      client.subscribe(`/user/${user.userId}/queue/notifications`, (frame) => {
        try {
          const n: Notification = JSON.parse(frame.body)
          setNotifications(prev => [n, ...prev])
          setUnread(c => c + 1)
        } catch { }
      })
    }
    client.activate()
    return () => { client.deactivate() }
  }, [accessToken, user?.userId])

  // Click ngoài để đóng
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = async () => {
    setOpen(o => !o)
    if (!open && notifications.length === 0) {
      setLoading(true)
      try {
        const list = await notificationService.list()
        setNotifications(list)
      } finally { setLoading(false) }
    }
  }

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead()
    setUnread(0)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'SESSION_CREATED': return '📅'
      case 'SESSION_UPDATED': return '✏️'
      case 'SESSION_DELETED': return '🗑️'
      case 'ATTENDANCE_REMINDER': return '⏰'
      default: return '🔔'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={handleOpen}
        className="relative p-2 rounded-xl hover:bg-surface-container text-on-surface-variant">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-editorial-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/15">
            <span className="font-headline font-bold text-on-surface">Thông báo</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={handleMarkAllRead}
                  className="text-xs text-primary-800 hover:text-primary-700 flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" /> Đọc tất cả
                </button>
              )}
              <button onClick={() => setOpen(false)}>
                <X className="w-4 h-4 text-on-surface-variant/60" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="py-8 text-center text-on-surface-variant/60 text-sm">Đang tải...</div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="py-8 text-center text-on-surface-variant/60 text-sm">Không có thông báo</div>
            )}
            {notifications.map(n => (
              <div key={n.notificationId}
                className={`px-4 py-3 border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low transition-colors ${!n.read ? 'bg-primary-100/40' : ''}`}>
                <div className="flex gap-2">
                  <span className="text-base flex-shrink-0">{typeIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-on-surface ${!n.read ? 'font-bold' : ''}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{n.message}</p>
                    <p className="text-xs text-on-surface-variant/60 mt-1">
                      {new Date(n.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 bg-primary-800 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}