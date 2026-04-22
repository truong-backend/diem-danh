import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAuthViewModel } from "../../viewmodels/useAuthViewModel";
import { MessageSquare, CalendarDays } from "lucide-react";
import {
  LayoutDashboard, BookOpen, Users, QrCode,
  LogOut, Menu, BookMarked, UserCircle, X,
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
    <div className="flex h-screen bg-surface">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 flex flex-col
        transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:block
      `}>
        {/* Inner card with margin */}
        <div className="m-3 flex-1 flex flex-col rounded-2xl bg-surface-container-lowest shadow-editorial-lg border border-outline-variant/15 h-[calc(100vh-1.5rem)] overflow-hidden">
          {/* Logo */}
          <div className="px-5 py-5 border-b border-outline-variant/15">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 primary-gradient rounded-2xl flex items-center justify-center shadow-editorial">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-headline font-black text-on-surface tracking-tight text-sm">AttendSys</span>
                  <p className="font-label uppercase tracking-[0.2em] text-[8px] font-headline font-bold text-on-surface-variant/60 mt-0.5">Curator Portal</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-on-surface-variant hover:text-on-surface">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {visibleItems.map((item) => (
              <NavLink key={item.to} to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-primary-100 text-primary-700 shadow-editorial"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface hover:translate-x-0.5"
                  }`
                }
                onClick={() => setMobileOpen(false)}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="font-label uppercase tracking-widest text-[10px] font-bold">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="px-3 pb-4 border-t border-outline-variant/15 pt-3">
            <button
              className="flex items-center gap-3 text-sm text-on-surface-variant hover:text-error w-full px-4 py-3 rounded-2xl hover:bg-error-container/30 transition-all duration-200"
              onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              <span className="font-label uppercase tracking-widest text-[10px] font-bold">Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        {/* Top header */}
        <div className="sticky top-0 z-20 glass-nav bg-surface/80 border-b border-outline-variant/15 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="p-2 rounded-2xl hover:bg-surface-container text-on-surface-variant transition-colors lg:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-headline font-black text-on-surface tracking-tight lg:hidden">AttendSys</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            {user && (
              <div className="flex items-center gap-2.5 text-sm text-on-surface-variant pl-1">
                <div className="w-8 h-8 rounded-full primary-gradient flex items-center justify-center text-white font-bold text-xs shadow-editorial">
                  {user.fullName?.charAt(0)?.toUpperCase()}
                </div>
                <span className="hidden sm:block font-semibold text-on-surface text-sm">{user.fullName}</span>
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