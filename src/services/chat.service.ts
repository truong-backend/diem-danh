import api from './api'
import type {
  Conversation,
  Message,
  SendMessagePayload,
  CreateGroupPayload,
  ChatUser,
} from '../models/chat.model'

const BASE = '/chat'

export const chatService = {
  // ── Conversations ─────────────────────────────────────────────────────────
  getMyConversations: () =>
    api.get<{ data: Conversation[] }>(`${BASE}/conversations`).then(r => r.data.data),

  openDirect: (targetUserId: string) =>
    api.post<{ data: Conversation }>(`${BASE}/conversations/direct/${targetUserId}`).then(r => r.data.data),

  /** Tạo nhóm GROUP — chỉ TEACHER/ADMIN có quyền, backend enforce */
  createGroup: (payload: CreateGroupPayload) =>
    api.post<{ data: Conversation }>(`${BASE}/conversations/group`, payload).then(r => r.data.data),

  getConversation: (conversationId: string) =>
    api.get<{ data: Conversation }>(`${BASE}/conversations/${conversationId}`).then(r => r.data.data),

  deleteGroup: (conversationId: string) =>
    api.delete(`${BASE}/conversations/${conversationId}`),

  leaveGroup: (conversationId: string) =>
    api.post(`${BASE}/conversations/${conversationId}/leave`),

  /** Đổi tên nhóm — chỉ admin nhóm (group role) */
  renameGroup: (conversationId: string, name: string) =>
    api.patch(`${BASE}/conversations/${conversationId}/name`, { name }),

  // ── Member management ──────────────────────────────────────────────────────
  getMembers: (conversationId: string): Promise<ChatUser[]> =>
    api.get<{ data: ChatUser[] }>(`${BASE}/conversations/${conversationId}/members`).then(r => r.data.data),

  addMember: (conversationId: string, targetUserId: string) =>
    api.post(`${BASE}/conversations/${conversationId}/members/${targetUserId}`),

  addMembers: (conversationId: string, userIds: string[]) =>
    api.post(`${BASE}/conversations/${conversationId}/members`, { userIds }),

  removeMember: (conversationId: string, targetUserId: string) =>
    api.delete(`${BASE}/conversations/${conversationId}/members/${targetUserId}`),

  promoteAdmin: (conversationId: string, targetUserId: string) =>
    api.post(`${BASE}/conversations/${conversationId}/members/${targetUserId}/promote`),

  demoteAdmin: (conversationId: string, targetUserId: string) =>
    api.post(`${BASE}/conversations/${conversationId}/members/${targetUserId}/demote`),

  // ── User search for chat picker ────────────────────────────────────────────
  searchUsers: (keyword?: string): Promise<ChatUser[]> =>
    api.get<{ data: ChatUser[] }>(`${BASE}/users`, { params: { keyword } }).then(r => r.data.data),

  // ── Messages ──────────────────────────────────────────────────────────────
  getMessages: (conversationId: string, page = 0, size = 30) =>
    api
      .get<{ data: Message[] }>(`${BASE}/conversations/${conversationId}/messages`, {
        params: { page, size },
      })
      .then(r => r.data.data),

  sendMessage: (payload: SendMessagePayload) =>
    api.post<{ data: Message }>(`${BASE}/messages`, payload).then(r => r.data.data),

  editMessage: (messageId: string, content: string) =>
    api.put<{ data: Message }>(`${BASE}/messages/${messageId}`, { content }).then(r => r.data.data),

  deleteMessage: (messageId: string) =>
    api.delete<{ data: Message }>(`${BASE}/messages/${messageId}`).then(r => r.data.data),

  /**
   * Ghim tin nhắn — chỉ TEACHER hoặc ADMIN (system role).
   * Backend sẽ kiểm tra lại và trả về 403 nếu không đủ quyền.
   * POST /api/chat/messages/{id}/pin
   */
  pinMessage: (messageId: string) =>
    api.post<{ data: Message }>(`${BASE}/messages/${messageId}/pin`).then(r => r.data.data),

  /**
   * Bỏ ghim tin nhắn — chỉ TEACHER hoặc ADMIN (system role).
   * POST /api/chat/messages/{id}/unpin
   */
  unpinMessage: (messageId: string) =>
    api.post<{ data: Message }>(`${BASE}/messages/${messageId}/unpin`).then(r => r.data.data),

  searchMessages: (conversationId: string, keyword: string) =>
    api
      .get<{ data: Message[] }>(`${BASE}/conversations/${conversationId}/messages/search`, {
        params: { keyword },
      })
      .then(r => r.data.data),

  /**
   * Lấy danh sách tin nhắn đã ghim.
   * Sắp xếp theo pinnedAt giảm dần (mới nhất trước).
   * GET /api/chat/conversations/{id}/pinned-messages
   */
  getPinnedMessages: (conversationId: string) =>
    api
      .get<{ data: Message[] }>(`${BASE}/conversations/${conversationId}/pinned-messages`)
      .then(r => r.data.data),

  uploadFile: async (file: File): Promise<{ fileUrl: string; fileName: string }> => {
    const form = new FormData()
    form.append('file', file)
    const r = await api.post<{ data: { fileUrl: string; fileName: string } }>(`${BASE}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return r.data.data
  },
}
