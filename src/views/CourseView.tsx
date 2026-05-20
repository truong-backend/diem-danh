import { useState, useEffect } from 'react'
import { courseService } from '../services/course.service'
import type { Course } from '../models/classroom.model'
import { Modal } from '../components/ui/Modal'
import { TableSkeleton } from '../components/ui/Skeleton'
import { Plus, Pencil, Trash2, BookMarked } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const EMPTY_FORM = { name: '', code: '', credits: 3, description: '' }

export default function CourseView() {
  const { isAdmin } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const [showEdit, setShowEdit] = useState(false)
  const [editTarget, setEditTarget] = useState<Course | null>(null)
  const [editForm, setEditForm] = useState({ name: '', credits: 3, description: '' })
  const [editSaving, setEditSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setCourses(await courseService.list())
    } catch {
      toast.error('Không thể tải danh sách môn học')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await courseService.create(createForm)
      toast.success('Tạo môn học thành công')
      setShowCreate(false)
      setCreateForm({ ...EMPTY_FORM })
      await load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Tạo môn học thất bại')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (c: Course) => {
    setEditTarget(c)
    setEditForm({ name: c.name, credits: c.credits, description: c.description || '' })
    setShowEdit(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setEditSaving(true)
    try {
      // Chỉ gửi name, credits, description — KHÔNG gửi code
      await courseService.update(editTarget.courseId, {
        name: editForm.name,
        credits: editForm.credits,
        description: editForm.description,
      })
      toast.success('Cập nhật môn học thành công')
      setShowEdit(false)
      await load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setEditSaving(false)
    }
  }

  const handleDelete = async (c: Course) => {
    if (!confirm(`Xoá môn học "${c.name}" (${c.code})?\nHành động này không thể hoàn tác.`)) return
    try {
      await courseService.delete(c.courseId)
      toast.success('Đã xoá môn học')
      await load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Xoá môn học thất bại')
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <span className="font-label uppercase tracking-[0.2em] text-[10px] font-bold text-primary-800 block mb-1">Học thuật</span>
          <h1 className="font-headline text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">Môn học</h1>
          <p className="text-on-surface-variant mt-1 text-sm">{courses.length} môn học trong hệ thống</p>
        </div>
        {isAdmin && (
          <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> Thêm môn học
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {loading ? <TableSkeleton /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/15 bg-surface-container/50">
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Mã môn</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Tên môn học</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Số tín chỉ</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Mô tả</th>
                  {isAdmin && <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.courseId} className="border-b border-outline-variant/10 hover:bg-surface-container-low/60 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs bg-surface-container px-2 py-1 rounded-lg border border-outline-variant/20">{c.code}</span>
                    </td>
                    <td className="px-5 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <BookMarked className="w-4 h-4 text-primary-700 shrink-0" />
                        {c.name}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-on-surface-variant">{c.credits} TC</td>
                    <td className="px-5 py-3 text-on-surface-variant/60 max-w-xs truncate">{c.description || '—'}</td>
                    {isAdmin && (
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="p-1.5 text-blue-400 hover:text-primary-800 hover:bg-primary-100 rounded"
                            title="Sửa môn học"
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Xoá môn học"
                            onClick={() => handleDelete(c)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {courses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-on-surface-variant/60">
                      <BookMarked className="w-8 h-8 mx-auto mb-2 text-on-surface-variant/40" />
                      Chưa có môn học nào. {isAdmin && 'Nhấn "Thêm môn học" để tạo mới.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal tạo môn học */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Thêm môn học mới" size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Mã môn học</label>
            <input
              type="text" className="input" placeholder="VD: CS101" required
              value={createForm.code}
              onChange={e => setCreateForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Tên môn học</label>
            <input
              type="text" className="input" placeholder="VD: Lập trình hướng đối tượng" required
              value={createForm.name}
              onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Số tín chỉ</label>
            <input
              type="number" className="input" min={1} max={10} required
              value={createForm.credits}
              onChange={e => setCreateForm(f => ({ ...f, credits: +e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">
              Mô tả <span className="text-on-surface-variant/60 font-normal">(tuỳ chọn)</span>
            </label>
            <textarea
              className="input resize-none" rows={3} placeholder="Mô tả ngắn về môn học..."
              value={createForm.description}
              onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Huỷ</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Đang tạo...' : 'Tạo môn học'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal sửa môn học */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title={`Sửa: ${editTarget?.name}`} size="sm">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">
              Mã môn <span className="text-on-surface-variant/60 font-normal">(không thể đổi)</span>
            </label>
            <input
              type="text"
              className="input bg-surface-container-low text-on-surface-variant/60 cursor-not-allowed"
              value={editTarget?.code || ''}
              disabled
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Tên môn học</label>
            <input
              type="text" className="input" required
              value={editForm.name}
              onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Số tín chỉ</label>
            <input
              type="number" className="input" min={1} max={10} required
              value={editForm.credits}
              onChange={e => setEditForm(f => ({ ...f, credits: +e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Mô tả</label>
            <textarea
              className="input resize-none" rows={3}
              value={editForm.description}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
            />
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
