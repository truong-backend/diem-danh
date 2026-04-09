export interface Message {
  messageId: string
  conversationId: string
  senderId: string
  senderName: string
  content: string
  type: 'TEXT' | 'FILE'
  fileUrl?: string
  fileName?: string
  isEdited: boolean
  isDeleted: boolean
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

export interface Conversation {
  conversationId: string
  /** PRIVATE | GROUP | CLASS */
  type: 'PRIVATE' | 'GROUP' | 'CLASS'
  name?: string
  /** Chỉ có khi type = CLASS */
  classId?: string
  avatarUrl?: string
  createdBy: string
  createdAt: string
  memberIds: string[]
  adminIds: string[]
  pinnedMessageIds: string[]
  lastMessage?: Message
}

export interface SendMessagePayload {
  conversationId: string
  content?: string
  type: 'TEXT' | 'FILE'
  fileUrl?: string
  fileName?: string
}

export interface CreateGroupPayload {
  name: string
  memberIds: string[]
}

/** Thông tin user dùng trong chat picker và danh sách thành viên */
export interface ChatUser {
  userId: string
  email: string
  fullName: string
  role: 'ADMIN' | 'TEACHER' | 'STUDENT'
  studentId?: string
  phone?: string
  active: boolean
}
