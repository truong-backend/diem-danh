import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAuthViewModel } from "../../viewmodels/useAuthViewModel";
import { X, Menu } from "lucide-react";
import { useState } from "react";
import NotificationBell from "./NotificationBell";

const navItems = [
  {
    to: "/dashboard",
    icon: "dashboard",
    label: "Dashboard",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
  },
  {
    to: "/timetable",
    icon: "calendar_today",
    label: "Thời khóa biểu",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
  },
  {
    to: "/classes",
    icon: "book",
    label: "Lớp học",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
  },
  { to: "/courses", icon: "menu_book", label: "Môn học", roles: ["ADMIN"] },
  {
    to: "/users",
    icon: "group",
    label: "Người dùng",
    roles: ["ADMIN", "TEACHER"],
  },
  {
    to: "/qr-checkin",
    icon: "qr_code_scanner",
    label: "Điểm danh QR",
    roles: ["STUDENT"],
  },
  {
    to: "/attendance-history",
    icon: "history",
    label: "Lịch sử điểm danh",
    roles: ["STUDENT"],
  },
  {
    to: "/chat",
    icon: "chat",
    label: "Tin nhắn",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
  },
  {
    to: "/profile",
    icon: "account_circle",
    label: "Trang cá nhân",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
  },
];

const roleLabel: Record<string, string> = {
  ADMIN: "Super Administrator",
  TEACHER: "Giảng viên",
  STUDENT: "Sinh viên",
};

function getInitials(name?: string) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

export default function Layout() {
  const { user } = useAuth();
  const { logout } = useAuthViewModel();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const visibleItems = navItems.filter(
    (item) => user && item.roles.includes(user.role),
  );
  const initials = getInitials(user?.fullName);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div
      className="flex h-screen bg-[#f8f9fb] text-[#191c1e]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ─── Sidebar ─── */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-40 w-64 flex flex-col
        border-r border-[#c3c6d6]/40 bg-[#f8f9fb]
        transition-transform duration-300
        lg:relative lg:translate-x-0
        py-6
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:block
      `}
      >
        {/* Logo */}
        <div className="px-6 pb-8">
          <h1
            style={{
              fontSize: 20,
              fontWeight: 900,
              lineHeight: "28px",
              color: "#003d9b",
            }}
          >
            AttendSys
          </h1>
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#434654",
              letterSpacing: "0.01em",
            }}
          >
            {user ? roleLabel[user.role] : "Admin Console"}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 space-y-0.5">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-[#50dcff] text-[#003d9b] font-bold mx-0"
                    : "text-[#434654] font-medium hover:bg-[#e7e8ea] mx-0"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 22,
                      fontVariationSettings: isActive
                        ? "'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24"
                        : "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24",
                    }}
                  >
                    {item.icon}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      lineHeight: "16px",
                      letterSpacing: "0.01em",
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        {/* <div className="px-4 pt-4 border-t border-[#c3c6d6]/40 mx-2">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#003d9b,#0052cc)" }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p style={{ fontSize: 12, fontWeight: 700, lineHeight: "16px" }} className="text-[#191c1e] truncate">
                {user?.fullName}
              </p>
              <p style={{ fontSize: 10, letterSpacing: "0.05em", textTransform: "uppercase" }} className="text-[#434654]">
                {user ? roleLabel[user.role] : ""}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[#434654] hover:text-[#ba1a1a] transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-[#ffdad6]/40"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
            <span style={{ fontSize: 12, fontWeight: 500 }}>Đăng xuất</span>
          </button>
        </div> */}

        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 lg:hidden"
        >
          <X size={18} className="text-[#434654]" />
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── Main ─── */}
      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        {/* Top header */}
        <header
          className="sticky top-0 z-20 flex justify-between items-center px-6 py-3 border-b border-[#c3c6d6]/30 shadow-sm"
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(8px)",
          }}
        >
          {/* Search */}
          <div className="flex items-center flex-1 max-w-xl gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 text-[#434654] lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="relative w-full hidden sm:block">
              <span
                className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#434654]"
                style={{ fontSize: 20 }}
              >
                search
              </span>
              <input
                className="w-full bg-[#f3f4f6] border-none rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-[#003d9b]/20 outline-none transition-all"
                placeholder="Tìm kiếm..."
                style={{ fontSize: 14 }}
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 ml-4">
            <NotificationBell />
            <button className="p-2 text-[#434654] hover:text-[#003d9b] transition-colors">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 22 }}
              >
                help_outline
              </span>
            </button>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-[#003d9b]/40"
                style={{
                  background: "linear-gradient(135deg,#003d9b,#0052cc)",
                }}
              >
                {initials}
              </button>

              {dropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  {/* Dropdown panel */}
                  <div
                    className="absolute right-0 mt-2 w-52 rounded-xl shadow-lg border border-[#c3c6d6]/40 bg-white z-50 overflow-hidden"
                    style={{ top: "100%" }}
                  >
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-[#c3c6d6]/30 flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                        style={{
                          background: "linear-gradient(135deg,#003d9b,#0052cc)",
                        }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-[#191c1e] truncate"
                          style={{ fontSize: 13, fontWeight: 700 }}
                        >
                          {user?.fullName}
                        </p>
                        <p
                          className="text-[#434654] truncate"
                          style={{
                            fontSize: 11,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {user ? roleLabel[user.role] : ""}
                        </p>
                      </div>
                    </div>

                    {/* Logout button */}
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-[#434654] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors"
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 18 }}
                      >
                        logout
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        Đăng xuất
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
