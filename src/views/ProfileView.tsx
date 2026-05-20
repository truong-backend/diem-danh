import { useState, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'
import { userService } from '../services/user.service'
import { Camera, Save, KeyRound, User, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfileView() {
  const { user } = useAuth()
  const { setAuth, accessToken, refreshToken } = useAuthStore()

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Dùng base64 preview ngay khi chọn file — không phụ thuộc URL MinIO có load được không
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 1. Preview ngay bằng base64 local — hiển thị tức thì
    const reader = new FileReader()
    reader.onload = ev => {
      setAvatarPreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)

    // 2. Upload lên MinIO trong nền
    setUploading(true)
    try {
      const url = await userService.uploadAvatar(file)
      // Sau khi upload xong, dùng URL MinIO public (nếu load được) hoặc giữ base64
      // Kiểm tra URL có load được không trước khi set
      const img = new Image()
      img.onload = () => {
        setAvatarPreview(url)
        // Cập nhật store với URL MinIO thật
        if (user && accessToken && refreshToken) {
          setAuth({ ...user, avatarUrl: url }, accessToken, refreshToken)
        }
      }
      img.onerror = () => {
        // URL không load được (MinIO nội bộ) → giữ base64 preview, vẫn update store
        if (user && accessToken && refreshToken) {
          setAuth({ ...user, avatarUrl: url }, accessToken, refreshToken)
        }
        // Preview vẫn hiển thị đúng qua base64
      }
      img.src = url
      toast.success('Cập nhật ảnh đại diện thành công')
    } catch (err: any) {
      // Revert preview nếu upload thất bại
      setAvatarPreview(user?.avatarUrl || null)
      const msg = err.response?.data?.message || 'Upload ảnh thất bại. Vui lòng thử lại.'
      toast.error(msg)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password && form.password !== form.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }
    setSaving(true)
    try {
      const payload: any = { fullName: form.fullName }
      if (form.phone) payload.phone = form.phone
      if (form.password) payload.password = form.password
      const updated = await userService.updateProfile(payload)
      if (user && accessToken && refreshToken) {
        setAuth(
          { ...user, fullName: updated.fullName, avatarUrl: updated.avatarUrl || user.avatarUrl },
          accessToken,
          refreshToken
        )
      }
      toast.success('Cập nhật thông tin thành công')
      setForm(f => ({ ...f, password: '', confirmPassword: '' }))
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setSaving(false)
    }
  }

  const roleLabel =
    user?.role === 'ADMIN' ? 'Quản trị viên'
    : user?.role === 'TEACHER' ? 'Giáo viên'
    : 'Sinh viên'

  const initials = user?.fullName?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <span className="font-label uppercase tracking-[0.2em] text-[10px] font-bold text-primary-800 block mb-1">Tài khoản</span>
        <h1 className="font-headline text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">Trang cá nhân</h1>
        <p className="text-on-surface-variant mt-1 text-sm">Quản lý thông tin và mật khẩu của bạn</p>
      </div>

      {/* Avatar card */}
      <div className="card p-4 sm:p-6 flex items-center gap-4 sm:gap-6">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden ring-2 ring-primary-200">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="avatar"
                className="w-full h-full object-cover"
                onError={() => {
                  // Nếu URL MinIO không load được → ẩn img, hiển thị chữ cái
                  setAvatarPreview(null)
                }}
              />
            ) : (
              <span className="text-3xl font-bold text-primary-700">{initials}</span>
            )}
          </div>

          {/* Nút camera */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-7 h-7 bg-primary-800 rounded-full flex items-center justify-center text-white hover:bg-primary-700 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            title="Đổi ảnh đại diện"
          >
            {uploading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Camera className="w-3.5 h-3.5" />
            }
          </button>

          <input
            type="file"
            ref={fileRef}
            className="hidden"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-on-surface text-lg truncate">{user?.fullName}</p>
          <p className="text-on-surface-variant text-sm truncate">{user?.email}</p>
          <span className="mt-1.5 inline-block text-xs px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-700 font-medium">
            {roleLabel}
          </span>
          {uploading && (
            <p className="mt-2 text-xs text-on-surface-variant/70 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Đang tải ảnh lên...
            </p>
          )}
        </div>
      </div>

      {/* Form thông tin */}
      <div className="card p-6">
        <h2 className="font-headline font-bold text-on-surface mb-5 flex items-center gap-2 text-lg">
          <User className="w-4 h-4" /> Thông tin cá nhân
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Họ và tên</label>
              <input
                className="input" required
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Số điện thoại</label>
              <input
                className="input" type="tel"
                placeholder="Nhập số điện thoại..."
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Email</label>
            <input
              className="input bg-surface-container-low cursor-not-allowed text-on-surface-variant"
              value={user?.email || ''} disabled
            />
          </div>

          {user?.studentId && (
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">MSSV</label>
              <input
                className="input bg-surface-container-low cursor-not-allowed text-on-surface-variant"
                value={user.studentId} disabled
              />
            </div>
          )}

          <hr className="border-outline-variant/30" />

          <h3 className="font-medium text-on-surface flex items-center gap-2 text-sm">
            <KeyRound className="w-4 h-4" /> Đổi mật khẩu{' '}
            <span className="text-on-surface-variant/60 font-normal">(để trống nếu không đổi)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Mật khẩu mới</label>
              <input
                className="input" type="password" placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Xác nhận mật khẩu</label>
              <input
                className="input" type="password" placeholder="••••••••"
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary flex items-center gap-2 text-sm" disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
