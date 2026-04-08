import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'
  const isTeacher = user?.role === 'TEACHER'
  const isStudent = user?.role === 'STUDENT'
  return { user, isAuthenticated, logout, isAdmin, isTeacher, isStudent }
}