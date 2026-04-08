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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm p-8">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900">Hệ thống Điểm danh</h1>
            <p className="text-sm text-slate-500 mt-1">Đăng nhập để tiếp tục</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Mật khẩu</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-6 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-700">Tài khoản demo:</p>
          <p>Admin: admin@school.edu.vn / Admin@123</p>
          <p>GV: teacher@school.edu.vn / Teacher@123</p>
          <p>SV: sv001@student.edu.vn / Student@123</p>
        </div>
      </div>
    </div>
  )
}