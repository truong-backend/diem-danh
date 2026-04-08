import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClassRoomViewModel } from "../viewmodels/useClassRoomViewModel";
import { useAuth } from "../hooks/useAuth";
import { Modal } from "../components/ui/Modal";
import { TableSkeleton } from "../components/ui/Skeleton";
import { Plus, Users, Calendar, ChevronRight, Info } from "lucide-react";
import { classroomService } from "../services/classroom.service";
import type { CreateClassRoomPayload, Course } from "../models/classroom.model";
import { userService } from "../services/user.service";

export default function ClassListView() {
  const { classes, loading, createClass } = useClassRoomViewModel();
  const { isAdmin, isTeacher, user } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [form, setForm] = useState<CreateClassRoomPayload>({
    name: "",
    courseId: "",
    teacherId: "",
    semester: "HK1",
    academicYear: "2024-2025",
    maxStudents: 40,
    schedule: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!showModal) return;
    // Luôn load courses
    classroomService.getCourses().then(setCourses);
    // Chỉ load danh sách giáo viên nếu là ADMIN (TEACHER không cần chọn, tự assign mình)
    if (isAdmin) {
      userService.list({ role: "TEACHER" }).then((r) => setTeachers(r.content));
    }
    // Nếu là TEACHER: tự động điền teacherId = userId của mình
    if (isTeacher && user) {
      setForm((f) => ({ ...f, teacherId: user.userId }));
    }
  }, [showModal]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = await createClass(form);
    setSaving(false);
    if (ok) {
      setShowModal(false);
      setForm({
        name: "",
        courseId: "",
        teacherId: "",
        semester: "HK1",
        academicYear: "2024-2025",
        maxStudents: 40,
        schedule: "",
      });
    }
  };

  // Chỉ ADMIN mới có quyền tạo lớp (backend đã enforce @PreAuthorize ADMIN)
  // TEACHER chỉ xem danh sách lớp của mình
  const canCreate = isAdmin;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lớp học</h1>
          <p className="text-slate-500 mt-1">
            {classes.length} lớp đang hoạt động
          </p>
        </div>
        {canCreate && (
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => setShowModal(true)}
          >
            <Plus className="w-4 h-4" /> Tạo lớp
          </button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="divide-y">
            {classes.map((cr) => (
              <div
                key={cr.classId}
                className="flex items-center px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/classes/${cr.classId}`)}
              >
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{cr.name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {cr.course?.name} • {cr.semester} {cr.academicYear}
                  </p>
                  {cr.teacher && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      GV: {cr.teacher.fullName}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {cr.studentCount || 0} SV
                  </span>
                  {cr.schedule && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {cr.schedule}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 ml-4" />
              </div>
            ))}
            {classes.length === 0 && (
              <p className="px-5 py-10 text-center text-slate-400">
                Chưa có lớp học nào
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal tạo lớp - chỉ ADMIN */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Tạo lớp học mới"
        size="md"
      >
        {courses.length === 0 ? (
          <div className="py-8 text-center">
            <Info className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
            <p className="text-slate-700 font-medium">Chưa có môn học nào</p>
            <p className="text-sm text-slate-500 mt-1">
              Vui lòng vào mục <strong>Môn học</strong> để tạo môn học trước khi
              tạo lớp.
            </p>
            <button
              className="btn-secondary mt-4"
              onClick={() => setShowModal(false)}
            >
              Đóng
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Tên lớp
              </label>
              <input
                className="input"
                required
                placeholder="VD: Lập trình Java - Nhóm 01"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Môn học
              </label>
              <select
                className="input"
                required
                value={form.courseId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, courseId: e.target.value }))
                }
              >
                <option value="">Chọn môn học</option>
                {courses.map((c) => (
                  <option key={c.courseId} value={c.courseId}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn giáo viên - chỉ hiện với ADMIN */}
            {isAdmin && (
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Giáo viên phụ trách
                </label>
                <select
                  className="input"
                  required
                  value={form.teacherId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, teacherId: e.target.value }))
                  }
                >
                  <option value="">Chọn giáo viên</option>
                  {teachers.map((t) => (
                    <option key={t.userId} value={t.userId}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Học kỳ
                </label>
                <input
                  className="input"
                  required
                  value={form.semester}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, semester: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Năm học
                </label>
                <input
                  className="input"
                  required
                  value={form.academicYear}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, academicYear: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Sĩ số tối đa
                </label>
                <input
                  type="number"
                  className="input"
                  min={1}
                  max={200}
                  value={form.maxStudents}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, maxStudents: +e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Lịch học
                </label>
                <select
                  className="input"
                  value={form.schedule}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, schedule: e.target.value }))
                  }
                >
                  <option value="">Chọn lịch học</option>

                  {/* Ca sáng */}
                  <option value="Thứ 2, 7:30-9:30">Thứ 2, 7:30-9:30</option>
                  <option value="Thứ 2, 9:30-11:30">Thứ 2, 9:30-11:30</option>

                  <option value="Thứ 3, 7:30-9:30">Thứ 3, 7:30-9:30</option>
                  <option value="Thứ 3, 9:30-11:30">Thứ 3, 9:30-11:30</option>

                  {/* Ca chiều */}
                  <option value="Thứ 4, 13:30-15:30">Thứ 4, 13:30-15:30</option>
                  <option value="Thứ 4, 15:30-17:30">Thứ 4, 15:30-17:30</option>

                  <option value="Thứ 5, 13:30-15:30">Thứ 5, 13:30-15:30</option>
                  <option value="Thứ 5, 15:30-17:30">Thứ 5, 15:30-17:30</option>

                  {/* Ca tối */}
                  <option value="Thứ 6, 18:00-20:00">Thứ 6, 18:00-20:00</option>
                  <option value="Thứ 6, 20:00-22:00">Thứ 6, 20:00-22:00</option>

                  <option value="Thứ 7, 7:30-9:30">Thứ 7, 7:30-9:30</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Huỷ
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Đang tạo..." : "Tạo lớp"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
