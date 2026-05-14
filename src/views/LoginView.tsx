import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthViewModel } from '../viewmodels/useAuthViewModel'

export default function LoginView() {
  const [email, setEmail] = useState('admin@school.edu.vn')
  const [password, setPassword] = useState('Admin@123')
  const [showPassword, setShowPassword] = useState(false)
  const { login, loading } = useAuthViewModel()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await login({ email, password })
    if (ok) navigate('/dashboard')
  }

  return (
    <main className="w-full min-h-screen flex flex-col md:flex-row">

      {/* ── Left: Visual Panel ── */}
      <section className="hidden md:flex md:w-1/2 lg:w-3/5 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-primary opacity-20 z-10" />
        {/* Gradient background thay ảnh */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-800" />
        {/* Decorative circles */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-40 h-40 bg-white/5 rounded-full" />

        <div className="relative z-20 flex flex-col justify-end p-12 h-full w-full bg-gradient-to-t from-blue-900/80 to-transparent">
          <div className="max-w-md">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
              </div>
              <span className="text-white font-bold text-xl tracking-tight">DiemDanh</span>
            </div>

            <h1 className="text-5xl font-bold text-white leading-tight mb-4">
              Quản lý<br />điểm danh<br />thông minh.
            </h1>
            <p className="text-blue-200 text-base leading-relaxed">
              Hàng nghìn trường học tin dùng hệ thống để theo dõi chuyên cần và quản lý học viên hiệu quả.
            </p>

            {/* Stats row */}
            <div className="flex gap-8 mt-10">
              {[
                { value: '10K+', label: 'Sinh viên' },
                { value: '500+', label: 'Giáo viên' },
                { value: '99.9%', label: 'Uptime' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-white font-bold text-2xl">{s.value}</p>
                  <p className="text-blue-300 text-sm">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Right: Login Form ── */}
      <section className="w-full md:w-1/2 lg:w-2/5 bg-white flex flex-col items-center justify-center px-8 py-12 md:px-12">
        <div className="w-full max-w-[400px]">

          {/* Brand header (mobile only shows logo) */}
          <div className="mb-8 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
            </div>
            <span className="font-bold text-xl text-blue-800 tracking-tight">DiemDanh</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Chào mừng trở lại</h2>
            <p className="text-gray-500 text-sm">Nhập thông tin đăng nhập để vào hệ thống.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  id="email"
                  type="email"
                  placeholder="email@truong.edu.vn"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider" htmlFor="password">
                Mật khẩu
              </label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <Link to="/forgot-password" className="text-xs text-blue-700 font-semibold hover:underline underline-offset-4">
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  Đăng nhập
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-500 space-y-1">
            <p className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-2">Tài khoản demo</p>
            <p>Admin: admin@school.edu.vn / Admin@123</p>
            <p>GV: teacher@school.edu.vn / Teacher@123</p>
            <p>SV: sv001@student.edu.vn / Student@123</p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-3">
            <div className="flex gap-6">
              <a className="text-xs text-gray-400 hover:text-gray-600 transition-colors" href="#">Chính sách</a>
              <a className="text-xs text-gray-400 hover:text-gray-600 transition-colors" href="#">Điều khoản</a>
            </div>
            <p className="text-xs text-gray-400">© 2024 DiemDanh Systems</p>
          </div>

        </div>
      </section>
    </main>
  )
}