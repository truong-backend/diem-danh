export interface Session {
  id?: number
  sessionId: string
  sessionNumber: number
  startTime: string
  endTime: string
  room: string
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED'
  classId?: string
  className?: string
  hasActiveQr: boolean
  qrExpiresAt?: string
}

export interface QrData {
  qrToken: string
  qrImageBase64: string
  expiresAt: string
  expiresInSeconds: number
  sessionId: string
}

export interface CreateSessionPayload {
  sessionNumber: number
  startTime: string
  endTime: string
  room: string
}