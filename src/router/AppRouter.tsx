import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import LoginView from '../views/LoginView'
import DashboardView from '../views/DashboardView'
import ClassListView from '../views/ClassListView'
import SessionAttendanceView from '../views/SessionAttendanceView'
import StudentListView from '../views/StudentListView'
import QrCheckInView from '../views/QrCheckInView'
import ReportView from '../views/ReportView'
import CourseView from '../views/CourseView'
import Layout from '../components/ui/Layout'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardView />} />
          <Route path="classes" element={<ClassListView />} />
          <Route path="classes/:classId" element={<SessionAttendanceView />} />
          <Route path="classes/:classId/sessions" element={<SessionAttendanceView />} />
          <Route path="classes/:classId/reports" element={<ReportView />} />
          <Route path="users" element={<StudentListView />} />
          <Route path="courses" element={<CourseView />} />
          <Route path="qr-checkin" element={<QrCheckInView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}