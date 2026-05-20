import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClassRoomViewModel } from "../viewmodels/useClassRoomViewModel";
import { useAuth } from "../hooks/useAuth";
import { Modal } from "../components/ui/Modal";
import { TableSkeleton } from "../components/ui/Skeleton";
import { Plus, Users, Calendar, ChevronRight, Trash2, Pencil, Check } from "lucide-react";
import { classroomService } from "../services/classroom.service";
import type { ClassRoom, CreateClassRoomPayload, Course } from "../models/classroom.model";
import { userService } from "../services/user.service";

// Tất cả các khung giờ có thể học
const ALL_SLOTS = [
  "Thứ 2, 7:30-9:30","Thứ 2, 9:30-11:30","Thứ 2, 13:30-15:30","Thứ 2, 15:30-17:30",
  "Thứ 3, 7:30-9:30","Thứ 3, 9:30-11:30","Thứ 3, 13:30-15:30","Thứ 3, 15:30-17:30",
  "Thứ 4, 7:30-9:30","Thứ 4, 9:30-11:30","Thứ 4, 13:30-15:30","Thứ 4, 15:30-17:30",
  "Thứ 5, 7:30-9:30","Thứ 5, 9:30-11:30","Thứ 5, 13:30-15:30","Thứ 5, 15:30-17:30",
  "Thứ 6, 7:30-9:30","Thứ 6, 9:30-11:30","Thứ 6, 13:30-15:30","Thứ 6, 15:30-17:30",
  "Thứ 6, 18:00-20:00","Thứ 6, 20:00-22:00",
  "Thứ 7, 7:30-9:30","Thứ 7, 9:30-11:30",
]

const scheduleToSlots = (schedule?: string): string[] =>
  schedule ? schedule.split("|").map(s => s.trim()).filter(Boolean) : []

const slotsToSchedule = (slots: string[]): string => slots.join(" | ")

const EMPTY_FORM: CreateClassRoomPayload = {
  name: "", courseId: "", teacherId: "",
  semester: "HK1", academicYear: "2024-2025",
  maxStudents: 40, schedule: "",
}

// ── ClassForm ─────────────────────────────────────────────────────────────────
interface ClassFormProps {
  form: CreateClassRoomPayload
  selectedSlots: string[]
  onChange: (field: keyof CreateClassRoomPayload, value: any) => void
  onToggleSlot: (slot: string) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  saving: boolean
  submitLabel: string
  courses: Course[]
  teachers: any[]
  isAdmin: boolean
}

function ClassForm({
  form, selectedSlots, onChange, onToggleSlot,
  onSubmit, onClose, saving, submitLabel,
  courses, teachers, isAdmin,
}: ClassFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Tên lớp */}
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Tên lớp</label>
        <input
          className="input" required
          placeholder="VD: Lập trình Java - Nhóm 01"
          value={form.name}
          onChange={e => onChange("name", e.target.value)}
        />
      </div>

      {/* Môn học */}
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Môn học</label>
        <select className="input" required value={form.courseId} onChange={e => onChange("courseId", e.target.value)}>
          <option value="">Chọn môn học</option>
          {courses.map(c => (
            <option key={c.courseId} value={c.courseId}>{c.name} ({c.code})</option>
          ))}
        </select>
      </div>

      {/* Giáo viên */}
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

      {/* Học kỳ + Năm học */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Học kỳ</label>
          <input className="input" required value={form.semester} onChange={e => onChange("semester", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Năm học</label>
          <input className="input" required value={form.academicYear} onChange={e => onChange("academicYear", e.target.value)} />
        </div>
      </div>

      {/* Sĩ số */}
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Sĩ số tối đa</label>
        <input
          type="number" className="input" min={1} max={200}
          value={form.maxStudents}
          onChange={e => onChange("maxStudents", +e.target.value)}
        />
      </div>

      {/* Lịch học */}
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">
          Lịch học
          {selectedSlots.length > 0 && (
            <span className="ml-2 text-primary-700 font-normal normal-case">
              ({selectedSlots.length} buổi đã chọn)
            </span>
          )}
        </label>

        {selectedSlots.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {selectedSlots.map(s => (
              <span
                key={s}
                className="inline-flex items-center gap-1 text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full font-medium cursor-pointer hover:bg-red-100 hover:text-red-600 transition-colors"
                onClick={() => onToggleSlot(s)}
                title="Nhấp để bỏ chọn"
              >
                {s} ×
              </span>
            ))}
          </div>
        )}

        <div className="border border-outline-variant/30 rounded-xl p-3 max-h-52 overflow-y-auto grid grid-cols-1 xs:grid-cols-2 gap-1.5 bg-surface-container/30">
          {ALL_SLOTS.map(slot => {
            const checked = selectedSlots.includes(slot)
            return (
              <label
                key={slot}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors
                  ${checked
                    ? "bg-primary-100 text-primary-800 font-medium"
                    : "hover:bg-surface-container text-on-surface-variant"
                  }`}
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
                  ${checked ? "bg-primary-800 border-primary-800" : "border-outline-variant"}`}
                >
                  {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => onToggleSlot(slot)}
                />
                {slot}
              </label>
            )
          })}
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

// ── Main component ─────────────────────────────────────────────────────────────
export default function ClassListView() {
  const { classes, loading, createClass, updateClass, deleteClass } = useClassRoomViewModel()
  const { isAdmin, isTeacher, user } = useAuth()
  const navigate = useNavigate()

  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<any[]>([])

  // Load courses + teachers ngay khi mount
  useEffect(() => {
    classroomService.getCourses().then(setCourses)
    if (isAdmin) {
      userService.list({ role: "TEACHER", size: 100 }).then(r => setTeachers(r.content))
    }
  }, [isAdmin])

  // ── Create modal ──────────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<CreateClassRoomPayload>({ ...EMPTY_FORM })
  const [createSlots, setCreateSlots] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  const handleCreateChange = (field: keyof CreateClassRoomPayload, value: any) =>
    setCreateForm(prev => ({ ...prev, [field]: value }))

  const toggleCreateSlot = (slot: string) =>
    setCreateSlots(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    const payload = {
      ...(isTeacher && user ? { ...createForm, teacherId: user.userId } : createForm),
      schedule: slotsToSchedule(createSlots),
    }
    const ok = await createClass(payload)
    setCreating(false)
    if (ok) {
      setShowCreate(false)
      setCreateForm({ ...EMPTY_FORM })
      setCreateSlots([])
    }
  }

  // ── Edit modal ────────────────────────────────────────────────────────────
  const [showEdit, setShowEdit] = useState(false)
  const [editTarget, setEditTarget] = useState<ClassRoom | null>(null)
  const [editForm, setEditForm] = useState<CreateClassRoomPayload>({ ...EMPTY_FORM })
  const [editSlots, setEditSlots] = useState<string[]>([])
  const [editing, setEditing] = useState(false)
  const [editLoading, setEditLoading] = useState(false)

  const handleEditChange = (field: keyof CreateClassRoomPayload, value: any) =>
    setEditForm(prev => ({ ...prev, [field]: value }))

  const toggleEditSlot = (slot: string) =>
    setEditSlots(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    )

  // ✅ FIX: Gọi getOne để lấy đầy đủ course + teacher thay vì dùng data từ list
  const openEdit = async (e: React.MouseEvent, cr: ClassRoom) => {
    e.stopPropagation()
    setEditLoading(true)
    setShowEdit(true)
    setEditTarget(cr)
    try {
      const full = await classroomService.getOne(cr.classId)
      setEditTarget(full)
      setEditForm({
        name: full.name,
        courseId: full.course?.courseId ?? "",
        teacherId: full.teacher?.userId ?? "",
        semester: full.semester,
        academicYear: full.academicYear,
        maxStudents: full.maxStudents ?? 40,
        schedule: full.schedule ?? "",
      })
      setEditSlots(scheduleToSlots(full.schedule))
    } catch {
      // fallback về data từ list nếu getOne lỗi
      setEditForm({
        name: cr.name,
        courseId: cr.course?.courseId ?? "",
        teacherId: cr.teacher?.userId ?? "",
        semester: cr.semester,
        academicYear: cr.academicYear,
        maxStudents: cr.maxStudents ?? 40,
        schedule: cr.schedule ?? "",
      })
      setEditSlots(scheduleToSlots(cr.schedule))
    } finally {
      setEditLoading(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setEditing(true)
    const ok = await updateClass(editTarget.classId, {
      ...editForm,
      schedule: slotsToSchedule(editSlots),
    })
    setEditing(false)
    if (ok) { setShowEdit(false); setEditTarget(null) }
  }

  const handleDelete = async (e: React.MouseEvent, classId: string, name: string) => {
    e.stopPropagation()
    if (!confirm(`Xoá lớp học "${name}"?\nToàn bộ buổi học và dữ liệu điểm danh sẽ bị xoá. Không thể hoàn tác.`)) return
    await deleteClass(classId)
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <span className="font-label uppercase tracking-[0.2em] text-[10px] font-bold text-primary-800 block mb-1">Quản lý lớp học</span>
          <h1 className="font-headline text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">Lớp học</h1>
          <p className="text-on-surface-variant mt-1 text-sm">{classes.length} lớp đang hoạt động</p>
        </div>
        {(isAdmin || isTeacher) && (
          <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> Tạo lớp
          </button>
        )}
      </div>

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
                    {cr.course?.name
                      ? <>{cr.course.name} &bull; {cr.semester} {cr.academicYear}</>
                      : <>{cr.semester} {cr.academicYear}</>
                    }
                  </p>
                  {/* ✅ FIX: Luôn hiện dòng GV, nếu chưa có data thì hiện dấu "—" */}
                  <p className="text-xs text-on-surface-variant/60 mt-0.5">
                    {/* GV: {cr.teacher?.fullName ?? "—"} */}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-on-surface-variant ml-4 shrink-0">
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" />{cr.studentCount ?? 0} SV</span>
                  {cr.schedule && (
                    <span className="items-center gap-1 hidden md:flex">
                      <Calendar className="w-4 h-4" />
                      <span className="max-w-xs truncate">{cr.schedule}</span>
                    </span>
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
      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); setCreateForm({ ...EMPTY_FORM }); setCreateSlots([]) }}
        title="Tạo lớp học mới"
        size="md"
      >
        <ClassForm
          form={createForm}
          selectedSlots={createSlots}
          onChange={handleCreateChange}
          onToggleSlot={toggleCreateSlot}
          onSubmit={handleCreate}
          onClose={() => { setShowCreate(false); setCreateForm({ ...EMPTY_FORM }); setCreateSlots([]) }}
          saving={creating}
          submitLabel="Tạo lớp"
          courses={courses}
          teachers={teachers}
          isAdmin={isAdmin}
        />
      </Modal>

      {/* Modal sửa lớp */}
      <Modal
        open={showEdit}
        onClose={() => { setShowEdit(false); setEditTarget(null) }}
        title={`Sửa: ${editTarget?.name ?? ""}`}
        size="md"
      >
        {editLoading ? (
          <div className="py-10 text-center text-on-surface-variant/60 text-sm">Đang tải thông tin lớp...</div>
        ) : (
          <ClassForm
            form={editForm}
            selectedSlots={editSlots}
            onChange={handleEditChange}
            onToggleSlot={toggleEditSlot}
            onSubmit={handleEdit}
            onClose={() => { setShowEdit(false); setEditTarget(null) }}
            saving={editing}
            submitLabel="Lưu thay đổi"
            courses={courses}
            teachers={teachers}
            isAdmin={isAdmin}
          />
        )}
      </Modal>
    </div>
  )
}