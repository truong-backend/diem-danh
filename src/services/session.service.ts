import api from "./api";
import type {
  Session,
  QrData,
  CreateSessionPayload,
} from "../models/session.model";
import type { ApiResponse } from "../models/report.model";

export const sessionService = {
  async list(classId: string): Promise<Session[]> {
    const res = await api.get<ApiResponse<Session[]>>(
      `/classrooms/${classId}/sessions`,
    );
    return res.data.data;
  },

  async listByClass(classId: string): Promise<Session[]> {
    return this.list(classId);
  },

  async create(classId: string, data: CreateSessionPayload): Promise<Session> {
    const res = await api.post<ApiResponse<Session>>(
      `/classrooms/${classId}/sessions`,
      data,
    );
    return res.data.data;
  },

  async getOne(sessionId: string): Promise<Session> {
    const res = await api.get<ApiResponse<Session>>(`/sessions/${sessionId}`);
    return res.data.data;
  },

  async update(
    sessionId: string,
    data: CreateSessionPayload,
  ): Promise<Session> {
    const res = await api.put<ApiResponse<Session>>(
      `/sessions/${sessionId}`,
      data,
    );
    return res.data.data;
  },

  async generateQr(sessionId: string): Promise<QrData> {
    const res = await api.post<ApiResponse<QrData>>(
      `/sessions/${sessionId}/qr`,
    );
    return res.data.data;
  },

  async getQr(sessionId: string): Promise<QrData> {
    const res = await api.get<ApiResponse<QrData>>(`/sessions/${sessionId}/qr`);
    return res.data.data;
  },
};
