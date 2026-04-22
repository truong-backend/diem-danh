import { useState, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'
import { userService } from '../services/user.service'
import { Camera, Save, KeyRound, User } from 'lucide-react'
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Preview tạm bằng base64 trong lúc upload
    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    // Upload lên MinIO
    setUploading(true)
    try {
      const url = await userService.uploadAvatar(file)
      // Cập nhật preview bằng URL MinIO thật (dùng sau reload)
      setAvatarPreview(url)
      // Cập nhật store với URL MinIO
      if (user && accessToken && refreshToken) {
        setAuth({ ...user, avatarUrl: url }, accessToken, refreshToken)
      }
      toast.success('Cập nhật ảnh thành công')
    } catch {
      // Revert preview nếu upload thất bại
      setAvatarPreview(user?.avatarUrl || null)
      toast.error('Upload ảnh thất bại')
    } finally {
      setUploading(false)
    }
    e.target.value = ''
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password && form.password !== form.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }
    setSaving(true)
    try {
      const payload: any = { fullName: form.fullName, phone: form.phone }
      if (form.password) payload.password = form.password
      const updated = await userService.updateProfile(payload)
      // Cập nhật store
      if (user && accessToken && refreshToken) {
        setAuth({ ...user, fullName: updated.fullName }, accessToken, refreshToken)
      }
      toast.success('Cập nhật thông tin thành công')
      setForm(f => ({ ...f, password: '', confirmPassword: '' }))
    } catch {
      toast.error('Cập nhật thất bại')
    } finally {
      setSaving(false)
    }
  }

  const roleLabel = user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'TEACHER' ? 'Giáo viên' : 'Sinh viên'

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <span className="font-label uppercase tracking-[0.2em] text-[10px] font-bold text-primary-800 block mb-1">Tài khoản</span>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Trang cá nhân</h1>
        <p className="text-on-surface-variant mt-1 text-sm">Quản lý thông tin và mật khẩu của bạn</p>
      </div>

      {/* Avatar */}
      <div className="card p-6 flex items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-primary-700">
                {user?.fullName?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-7 h-7 bg-primary-800 rounded-full flex items-center justify-center text-white hover:bg-primary-700 shadow-editorial"
            title="Đổi ảnh đại diện"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="font-semibold text-on-surface text-lg">{user?.fullName}</p>
          <p className="text-on-surface-variant text-sm">{user?.email}</p>
          <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-medium">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="card p-6">
        <h2 className="font-headline font-bold text-on-surface mb-5 flex items-center gap-2 text-lg">
          <User className="w-4 h-4" /> Thông tin cá nhân
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Họ và tên</label>
              <input
                className="input"
                required
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Số điện thoại</label>
              <input
                className="input"
                type="tel"
                placeholder="Nhập số điện thoại..."
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Email</label>
            <input className="input bg-surface-container-low cursor-not-allowed" value={user?.email || ''} disabled />
          </div>

          {user?.studentId && (
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">MSSV</label>
              <input className="input bg-surface-container-low cursor-not-allowed" value={user.studentId} disabled />
            </div>
          )}

          <hr className="border-outline-variant/30" />

          <h3 className="font-medium text-on-surface flex items-center gap-2 text-sm">
            <KeyRound className="w-4 h-4" /> Đổi mật khẩu <span className="text-on-surface-variant/60 font-normal">(để trống nếu không đổi)</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Mật khẩu mới</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Xác nhận mật khẩu</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}