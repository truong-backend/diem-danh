import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { BookOpen, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import api from '../services/api'

export default function ResetPasswordView() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) setError('Link không hợp lệ. Vui lòng yêu cầu lại.')
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, newPassword })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Link không hợp lệ hoặc đã hết hạn.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 primary-gradient rounded-full blur-3xl opacity-10" />
        <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-secondary-container rounded-full blur-3xl opacity-30" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 primary-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-editorial-lg">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <span className="font-label uppercase tracking-[0.2em] text-[10px] font-bold text-primary-800 block mb-2">Hệ thống Điểm danh</span>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Đặt lại mật khẩu</h1>
          <p className="text-sm text-on-surface-variant mt-2">
            {success ? 'Thành công! Đang chuyển hướng...' : 'Nhập mật khẩu mới của bạn'}
          </p>
        </div>

        <div className="card p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-on-surface font-medium">Mật khẩu đã được đặt lại!</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Bạn sẽ được chuyển về trang đăng nhập sau 3 giây.
                </p>
              </div>
              <Link to="/login" className="text-xs text-primary-600 hover:underline">
                Đăng nhập ngay
              </Link>
            </div>
          ) : !token ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-sm text-on-surface">Link không hợp lệ.</p>
              <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline">
                Yêu cầu link mới
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Tối thiểu 6 ký tự"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                    onClick={() => setShowPassword(v => !v)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">
                  Xác nhận mật khẩu
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button type="submit" className="btn-primary w-full py-3 text-sm" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </button>
            </form>
          )}

          {!success && (
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-xs text-on-surface-variant hover:text-primary-600 transition-colors"
              >
                Quay lại đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}