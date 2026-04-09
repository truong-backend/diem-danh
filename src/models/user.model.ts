export interface User {
  id?: number
  userId: string
  email: string
  fullName: string
  role: 'ADMIN' | 'TEACHER' | 'STUDENT'
  studentId?: string
  phone?: string
  active: boolean
  createdAt?: string
  avatarUrl?: string
}

export interface AuthUser {
  userId: string
  email: string
  fullName: string
  role: 'ADMIN' | 'TEACHER' | 'STUDENT'
  studentId?: string
  avatarUrl?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: AuthUser
}