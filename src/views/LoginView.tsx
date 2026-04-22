import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthViewModel } from '../viewmodels/useAuthViewModel'
import { BookOpen } from 'lucide-react'

export default function LoginView() {
  const [email, setEmail] = useState('admin@school.edu.vn')
  const [password, setPassword] = useState('Admin@123')
  const { login, loading } = useAuthViewModel()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await login({ email, password })
    if (ok) navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 primary-gradient rounded-full blur-3xl opacity-10" />
        <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-secondary-container rounded-full blur-3xl opacity-30" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 primary-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-editorial-lg">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <span className="font-label uppercase tracking-[0.2em] text-[10px] font-bold text-primary-800 block mb-2">Cổng thông tin sinh viên</span>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Hệ thống Điểm danh</h1>
          <p className="text-sm text-on-surface-variant mt-2">Đăng nhập để tiếp tục</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Mật khẩu</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full py-3 text-sm" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-surface-container rounded-2xl text-xs text-on-surface-variant space-y-1.5">
            <p className="font-headline font-bold text-on-surface uppercase tracking-widest text-[10px] mb-2">Tài khoản demo</p>
            <p>Admin: admin@school.edu.vn / Admin@123</p>
            <p>GV: teacher@school.edu.vn / Teacher@123</p>
            <p>SV: sv001@student.edu.vn / Student@123</p>
          </div>
        </div>
      </div>
    </div>
  )
}