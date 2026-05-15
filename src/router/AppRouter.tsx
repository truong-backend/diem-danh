import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTokenExpiry } from '../hooks/useTokenExpiry'
import { ProtectedRoute } from './ProtectedRoute'
import LoginView from '../views/LoginView'
import ForgotPasswordView from '../views/ForgotPasswordView'
import ResetPasswordView from '../views/ResetPasswordView'
import DashboardView from '../views/DashboardView'
import ClassListView from '../views/ClassListView'
import SessionAttendanceView from '../views/SessionAttendanceView'
import StudentListView from '../views/StudentListView'
import QrCheckInView from '../views/QrCheckInView'
import ReportView from '../views/ReportView'
import CourseView from '../views/CourseView'
import Layout from '../components/ui/Layout'
import ChatView from '../views/ChatView'
import ProfileView from '../views/ProfileView'
import TimetableView from '../views/TimetableView'

/** Component con duoc mount ben trong BrowserRouter de dung duoc useNavigate */
function TokenExpiryWatcher() {
  useTokenExpiry()
  return null
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <TokenExpiryWatcher />
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="/forgot-password" element={<ForgotPasswordView />} />
        <Route path="/reset-password" element={<ResetPasswordView />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardView />} />
          <Route path="timetable" element={<TimetableView />} />
          <Route path="classes" element={<ClassListView />} />
          <Route path="classes/:classId" element={<SessionAttendanceView />} />
          <Route path="classes/:classId/sessions" element={<SessionAttendanceView />} />
          <Route path="classes/:classId/reports" element={<ReportView />} />
          <Route path="users" element={<StudentListView />} />
          <Route path="courses" element={<CourseView />} />
          <Route path="qr-checkin" element={<QrCheckInView />} />
          <Route path="chat" element={<ChatView />} />
          <Route path="profile" element={<ProfileView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}