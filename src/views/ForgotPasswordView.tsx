import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import api from '../services/api'

export default function ForgotPasswordView() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {
      setError('Có lỗi xảy ra, vui lòng thử lại.')
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
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Quên mật khẩu</h1>
          <p className="text-sm text-on-surface-variant mt-2">
            {sent ? 'Kiểm tra hộp thư của bạn' : 'Nhập email để nhận link đặt lại'}
          </p>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-on-surface font-medium">Email đã được gửi!</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Nếu <span className="font-medium">{email}</span> tồn tại trong hệ thống,
                  bạn sẽ nhận được link đặt lại mật khẩu. Link có hiệu lực <strong>15 phút</strong>.
                </p>
              </div>
              <p className="text-xs text-on-surface-variant">Không thấy email? Kiểm tra thư mục Spam.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input
                    type="email"
                    className="input pl-10"
                    placeholder="email@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button type="submit" className="btn-primary w-full py-3 text-sm" disabled={loading}>
                {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}