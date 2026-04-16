import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAuthViewModel } from "../../viewmodels/useAuthViewModel";
import { MessageSquare, CalendarDays } from "lucide-react";
import {
  LayoutDashboard, BookOpen, Users, QrCode,
  LogOut, Menu, BookMarked, UserCircle,
} from "lucide-react";
import { useState } from "react";
import NotificationBell from "./NotificationBell";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["ADMIN", "TEACHER", "STUDENT"] },
  { to: "/timetable", icon: CalendarDays, label: "Thời khóa biểu", roles: ["ADMIN", "TEACHER", "STUDENT"] },
  { to: "/classes", icon: BookOpen, label: "Lớp học", roles: ["ADMIN", "TEACHER", "STUDENT"] },
  { to: "/courses", icon: BookMarked, label: "Môn học", roles: ["ADMIN"] },
  { to: "/users", icon: Users, label: "Người dùng", roles: ["ADMIN", "TEACHER"] },
  { to: "/qr-checkin", icon: QrCode, label: "Điểm danh QR", roles: ["STUDENT"] },
  { to: "/chat", icon: MessageSquare, label: "Tin nhắn", roles: ["ADMIN", "TEACHER", "STUDENT"] },
  { to: "/profile", icon: UserCircle, label: "Trang cá nhân", roles: ["ADMIN", "TEACHER", "STUDENT"] },
];

export default function Layout() {
  const { user } = useAuth();
  const { logout } = useAuthViewModel();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = navItems.filter(item => user && item.roles.includes(user.role));

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r flex flex-col
        transform transition-transform lg:relative lg:translate-x-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo */}
        <div className="px-6 py-5 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">AttendSys</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
              onClick={() => setMobileOpen(false)}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-4 border-t pt-3">
          <button
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 w-full px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
            onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Top header */}
        <div className="sticky top-0 z-20 bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="p-1 rounded lg:hidden">
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <span className="font-semibold text-slate-900 lg:hidden">AttendSys</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            {user && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                  {user.fullName?.charAt(0)?.toUpperCase()}
                </div>
                <span className="hidden sm:block">{user.fullName}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}