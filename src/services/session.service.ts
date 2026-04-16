import api from './api'
import type { Session, CreateSessionPayload } from '../models/session.model'

const BASE = '/classrooms'

export const sessionService = {
  list: (classId: string): Promise<Session[]> =>
    api.get(`${BASE}/${classId}/sessions`).then(r => r.data.data),

  create: (classId: string, payload: CreateSessionPayload): Promise<Session> =>
    api.post(`${BASE}/${classId}/sessions`, payload).then(r => r.data.data),

  update: (sessionId: string, payload: CreateSessionPayload): Promise<Session> =>
    api.put(`/sessions/${sessionId}`, payload).then(r => r.data.data),

  delete: (sessionId: string): Promise<void> =>
    api.delete(`/sessions/${sessionId}`).then(() => undefined),

  generateQr: (sessionId: string) =>
    api.post(`/sessions/${sessionId}/qr`).then(r => r.data.data),

  getQr: (sessionId: string) =>
    api.get(`/sessions/${sessionId}/qr`).then(r => r.data.data),
}