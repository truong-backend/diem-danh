import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClassRoomViewModel } from "../viewmodels/useClassRoomViewModel";
import { useAuth } from "../hooks/useAuth";
import { Modal } from "../components/ui/Modal";
import { TableSkeleton } from "../components/ui/Skeleton";
import { Plus, Users, Calendar, ChevronRight, Info, Trash2, Pencil } from "lucide-react";
import { classroomService } from "../services/classroom.service";
import type { ClassRoom, CreateClassRoomPayload, Course } from "../models/classroom.model";
import { userService } from "../services/user.service";

const SCHEDULES = [
  "Thứ 2, 7:30-9:30","Thứ 2, 9:30-11:30","Thứ 2, 13:30-15:30","Thứ 2, 15:30-17:30",
  "Thứ 3, 7:30-9:30","Thứ 3, 9:30-11:30","Thứ 3, 13:30-15:30","Thứ 3, 15:30-17:30",
  "Thứ 4, 7:30-9:30","Thứ 4, 9:30-11:30","Thứ 4, 13:30-15:30","Thứ 4, 15:30-17:30",
  "Thứ 5, 7:30-9:30","Thứ 5, 9:30-11:30","Thứ 5, 13:30-15:30","Thứ 5, 15:30-17:30",
  "Thứ 6, 7:30-9:30","Thứ 6, 9:30-11:30","Thứ 6, 13:30-15:30","Thứ 6, 15:30-17:30",
  "Thứ 6, 18:00-20:00","Thứ 6, 20:00-22:00",
  "Thứ 7, 7:30-9:30","Thứ 7, 9:30-11:30",
]

const EMPTY_FORM: CreateClassRoomPayload = {
  name: "", courseId: "", teacherId: "",
  semester: "HK1", academicYear: "2024-2025",
  maxStudents: 40, schedule: "",
}

// ============================================================
// ClassForm tách ra NGOÀI component chính để tránh re-mount
// khi state của ClassListView thay đổi → input không bị mất focus
// ============================================================
interface ClassFormProps {
  form: CreateClassRoomPayload
  onChange: (field: keyof CreateClassRoomPayload, value: any) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  saving: boolean
  submitLabel: string
  courses: Course[]
  teachers: any[]
  isAdmin: boolean
  noCourses?: boolean
}

function ClassForm({
  form, onChange, onSubmit, onClose, saving, submitLabel,
  courses, teachers, isAdmin, noCourses,
}: ClassFormProps) {
  if (noCourses) {
    return (
      <div className="py-8 text-center">
        <Info className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
        <p className="text-on-surface font-medium">Chưa có môn học nào</p>
        <p className="text-sm text-on-surface-variant mt-1">Vui lòng tạo môn học trước.</p>
        <button className="btn-secondary mt-4" onClick={onClose}>Đóng</button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Tên lớp</label>
        <input
          className="input" required
          placeholder="VD: Lập trình Java - Nhóm 01"
          value={form.name}
          onChange={e => onChange("name", e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Môn học</label>
        <select className="input" required value={form.courseId} onChange={e => onChange("courseId", e.target.value)}>
          <option value="">Chọn môn học</option>
          {courses.map(c => (
            <option key={c.courseId} value={c.courseId}>{c.name} ({c.code})</option>
          ))}
        </select>
      </div>

      {isAdmin && (
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Giáo viên phụ trách</label>
          <select className="input" required value={form.teacherId} onChange={e => onChange("teacherId", e.target.value)}>
            <option value="">Chọn giáo viên</option>
            {teachers.map(t => (
              <option key={t.userId} value={t.userId}>{t.fullName}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Học kỳ</label>
          <input className="input" required value={form.semester} onChange={e => onChange("semester", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Năm học</label>
          <input className="input" required value={form.academicYear} onChange={e => onChange("academicYear", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Sĩ số tối đa</label>
          <input
            type="number" className="input" min={1} max={200}
            value={form.maxStudents}
            onChange={e => onChange("maxStudents", +e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Lịch học</label>
          <select className="input" value={form.schedule || ""} onChange={e => onChange("schedule", e.target.value)}>
            <option value="">Chọn lịch học</option>
            {SCHEDULES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Huỷ</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Đang lưu..." : submitLabel}
        </button>
      </div>
    </form>
  )
}

// ============================================================
// Main component
// ============================================================
export default function ClassListView() {
  const { classes, loading, createClass, updateClass, deleteClass } = useClassRoomViewModel()
  const { isAdmin, isTeacher, user } = useAuth()
  const navigate = useNavigate()

  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [metaLoaded, setMetaLoaded] = useState(false)

  // --- Create modal ---
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<CreateClassRoomPayload>({ ...EMPTY_FORM })
  const [creating, setCreating] = useState(false)

  // --- Edit modal ---
  const [showEdit, setShowEdit] = useState(false)
  const [editTarget, setEditTarget] = useState<ClassRoom | null>(null)
  const [editForm, setEditForm] = useState<CreateClassRoomPayload>({ ...EMPTY_FORM })
  const [editing, setEditing] = useState(false)

  // Load danh sách môn + giáo viên khi cần
  const loadMeta = async () => {
    if (metaLoaded) return
    const [c] = await Promise.all([classroomService.getCourses()])
    setCourses(c)
    if (isAdmin) {
      const t = await userService.list({ role: "TEACHER", size: 100 })
      setTeachers(t.content)
    }
    setMetaLoaded(true)
  }

  useEffect(() => {
    if (showCreate || showEdit) loadMeta()
  }, [showCreate, showEdit])

  // Handler dùng chung thay đổi 1 field — tránh tạo object mới mỗi render
  const handleCreateChange = (field: keyof CreateClassRoomPayload, value: any) => {
    setCreateForm(prev => ({ ...prev, [field]: value }))
  }

  const handleEditChange = (field: keyof CreateClassRoomPayload, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    const payload = isTeacher && user
      ? { ...createForm, teacherId: user.userId }
      : createForm
    const ok = await createClass(payload)
    setCreating(false)
    if (ok) {
      setShowCreate(false)
      setCreateForm({ ...EMPTY_FORM })
    }
  }

  const openEdit = (e: React.MouseEvent, cr: ClassRoom) => {
    e.stopPropagation()
    setEditTarget(cr)
    // Pre-fill đầy đủ dữ liệu hiện tại của lớp
    setEditForm({
      name: cr.name,
      courseId: cr.course?.courseId ?? "",
      teacherId: cr.teacher?.userId ?? "",
      semester: cr.semester,
      academicYear: cr.academicYear,
      maxStudents: cr.maxStudents ?? 40,
      schedule: cr.schedule ?? "",
    })
    setShowEdit(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setEditing(true)
    const ok = await updateClass(editTarget.classId, editForm)
    setEditing(false)
    if (ok) {
      setShowEdit(false)
      setEditTarget(null)
    }
  }

  const handleDelete = async (e: React.MouseEvent, classId: string, name: string) => {
    e.stopPropagation()
    if (!confirm(`Xoá lớp học "${name}"?\nToàn bộ buổi học và dữ liệu điểm danh sẽ bị xoá. Không thể hoàn tác.`)) return
    await deleteClass(classId)
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-label uppercase tracking-[0.2em] text-[10px] font-bold text-primary-800 block mb-1">Quản lý lớp học</span>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Lớp học</h1>
          <p className="text-on-surface-variant mt-1 text-sm">{classes.length} lớp đang hoạt động</p>
        </div>
        {(isAdmin || isTeacher) && (
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> Tạo lớp
          </button>
        )}
      </div>

      {/* Danh sách lớp */}
      <div className="card">
        {loading ? <TableSkeleton /> : (
          <div className="divide-y divide-outline-variant/10">
            {classes.map(cr => (
              <div
                key={cr.classId}
                className="flex items-center px-5 py-4 hover:bg-surface-container-low cursor-pointer transition-colors group"
                onClick={() => navigate(`/classes/${cr.classId}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-on-surface truncate">{cr.name}</p>
                  <p className="text-sm text-on-surface-variant mt-0.5">
                    {cr.course?.name} &bull; {cr.semester} {cr.academicYear}
                  </p>
                  {cr.teacher && (
                    <p className="text-xs text-on-surface-variant/60 mt-0.5">GV: {cr.teacher.fullName}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-on-surface-variant ml-4 shrink-0">
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" />{cr.studentCount ?? 0} SV</span>
                  {cr.schedule && (
                    <span className="items-center gap-1 hidden md:flex"><Calendar className="w-4 h-4" />{cr.schedule}</span>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex items-center ml-3 gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Sửa lớp học"
                      onClick={e => openEdit(e, cr)}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Xoá lớp học"
                      onClick={e => handleDelete(e, cr.classId, cr.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <ChevronRight className="w-5 h-5 text-on-surface-variant/40 ml-2 shrink-0" />
              </div>
            ))}
            {classes.length === 0 && (
              <p className="px-5 py-10 text-center text-on-surface-variant/60">Chưa có lớp học nào</p>
            )}
          </div>
        )}
      </div>

      {/* Modal tạo lớp */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setCreateForm({ ...EMPTY_FORM }) }} title="Tạo lớp học mới" size="md">
        <ClassForm
          form={createForm}
          onChange={handleCreateChange}
          onSubmit={handleCreate}
          onClose={() => { setShowCreate(false); setCreateForm({ ...EMPTY_FORM }) }}
          saving={creating}
          submitLabel="Tạo lớp"
          courses={courses}
          teachers={teachers}
          isAdmin={isAdmin}
          noCourses={courses.length === 0}
        />
      </Modal>

      {/* Modal sửa lớp */}
      <Modal
        open={showEdit}
        onClose={() => { setShowEdit(false); setEditTarget(null) }}
        title={`Sửa: ${editTarget?.name ?? ""}`}
        size="md"
      >
        <ClassForm
          form={editForm}
          onChange={handleEditChange}
          onSubmit={handleEdit}
          onClose={() => { setShowEdit(false); setEditTarget(null) }}
          saving={editing}
          submitLabel="Lưu thay đổi"
          courses={courses}
          teachers={teachers}
          isAdmin={isAdmin}
        />
      </Modal>
    </div>
  )
}
