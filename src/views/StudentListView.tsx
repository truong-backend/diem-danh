import { useUserViewModel } from '../viewmodels/useUserViewModel'
import { UserFilter } from '../components/ui/Filter'
import { RoleBadge } from '../components/ui/Badge'
import { TableSkeleton } from '../components/ui/Skeleton'
import { Modal } from '../components/ui/Modal'
import { useState } from 'react'
import { Plus, Trash2, Pencil, BanIcon, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import type { User } from '../models/user.model'

const EMPTY_FORM = {
  email: '', password: '', fullName: '',
  role: 'STUDENT', studentId: '', phone: ''
}

export default function StudentListView() {
  const {
    data, loading, search, setSearch, role, setRole,
    page, setPage, createUser, updateUser, disableUser, activateUser, deleteUser
  } = useUserViewModel()
  const { isAdmin } = useAuth()

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  // Edit modal
  const [showEdit, setShowEdit] = useState(false)
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', password: '', role: '' })
  const [editSaving, setEditSaving] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const ok = await createUser(createForm)
    setSaving(false)
    if (ok) { setShowCreate(false); setCreateForm({ ...EMPTY_FORM }) }
  }

  const openEdit = (u: User) => {
    setEditTarget(u)
    setEditForm({ fullName: u.fullName, phone: u.phone || '', password: '', role: u.role })
    setShowEdit(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setEditSaving(true)
    const payload: any = { fullName: editForm.fullName, phone: editForm.phone, role: editForm.role }
    if (editForm.password) payload.password = editForm.password
    const ok = await updateUser(editTarget.userId, payload)
    setEditSaving(false)
    if (ok) setShowEdit(false)
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>
          <p className="text-slate-500 mt-1">
            {data ? `${data.totalElements} người dùng` : ''}
          </p>
        </div>
        {isAdmin && (
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> Thêm user
          </button>
        )}
      </div>

      <UserFilter search={search} onSearch={setSearch} role={role} onRole={setRole} />

      <div className="card">
        {loading ? <TableSkeleton /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left px-5 py-3 text-slate-500 font-medium">Họ tên</th>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium">Email</th>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium">MSSV</th>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium">Role</th>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium">Trạng thái</th>
                    {isAdmin && <th className="px-5 py-3 text-slate-500 font-medium text-right">Thao tác</th>}
                  </tr>
                </thead>
                <tbody>
                  {data?.content.map(u => (
                    <tr key={u.userId} className="border-b hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium">{u.fullName}</td>
                      <td className="px-5 py-3 text-slate-500">{u.email}</td>
                      <td className="px-5 py-3 font-mono text-xs">{u.studentId || '—'}</td>
                      <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {u.active ? 'Hoạt động' : 'Vô hiệu'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {/* Sửa */}
                            <button
                              className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Sửa thông tin"
                              onClick={() => openEdit(u)}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {/* Vô hiệu hóa / Kích hoạt lại */}
                            {u.active ? (
                              <button
                                className="p-1.5 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50 rounded"
                                title="Vô hiệu hóa tài khoản"
                                onClick={() => {
                                  if (confirm(`Vô hiệu hóa tài khoản "${u.fullName}"?`))
                                    disableUser(u.userId)
                                }}
                              >
                                <BanIcon className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded"
                                title="Kích hoạt lại tài khoản"
                                onClick={() => {
                                  if (confirm(`Kích hoạt lại tài khoản "${u.fullName}"?`))
                                    activateUser(u.userId)
                                }}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {/* Xóa cứng */}
                            <button
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Xóa vĩnh viễn"
                              onClick={() => {
                                if (confirm(`Xóa vĩnh viễn user "${u.fullName}"? Hành động này không thể hoàn tác!`))
                                  deleteUser(u.userId)
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {data?.content.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">Không tìm thấy user nào</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t">
                <p className="text-sm text-slate-500">
                  Trang {page + 1} / {data.totalPages} ({data.totalElements} kết quả)
                </p>
                <div className="flex gap-2">
                  <button className="btn-secondary p-2" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="btn-secondary p-2" disabled={data.last} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal tạo user */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Thêm người dùng mới" size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          {[
            { label: 'Họ tên', key: 'fullName', type: 'text', required: true },
            { label: 'Email', key: 'email', type: 'email', required: true },
            { label: 'Mật khẩu', key: 'password', type: 'password', required: true },
            { label: 'MSSV (nếu là SV)', key: 'studentId', type: 'text', required: false },
            { label: 'Số điện thoại', key: 'phone', type: 'tel', required: false },
          ].map(f => (
            <div key={f.key}>
              <label className="text-sm font-medium text-slate-700 block mb-1">{f.label}</label>
              <input
                type={f.type}
                className="input"
                required={f.required}
                value={(createForm as any)[f.key]}
                onChange={e => setCreateForm(x => ({ ...x, [f.key]: e.target.value }))}
              />
            </div>
          ))}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Role</label>
            <select className="input" value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}>
              <option value="STUDENT">Sinh viên</option>
              <option value="TEACHER">Giáo viên</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Huỷ</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Đang tạo...' : 'Tạo user'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal sửa user */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title={`Sửa: ${editTarget?.fullName}`} size="sm">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Họ tên</label>
            <input
              type="text" className="input" required
              value={editForm.fullName}
              onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Số điện thoại</label>
            <input
              type="tel" className="input"
              value={editForm.phone}
              onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Mật khẩu mới <span className="text-slate-400 font-normal">(để trống nếu không đổi)</span>
            </label>
            <input
              type="password" className="input"
              placeholder="••••••••"
              value={editForm.password}
              onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Role</label>
            <select className="input" value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
              <option value="STUDENT">Sinh viên</option>
              <option value="TEACHER">Giáo viên</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowEdit(false)}>Huỷ</button>
            <button type="submit" className="btn-primary" disabled={editSaving}>
              {editSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}