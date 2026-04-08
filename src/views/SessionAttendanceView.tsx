import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  useSessionViewModel,
  useQrViewModel,
} from "../viewmodels/useSessionViewModel";
import { useAttendanceViewModel } from "../viewmodels/useAttendanceViewModel";
import { useClassDetailViewModel } from "../viewmodels/useClassRoomViewModel";
import { useReportViewModel } from "../viewmodels/useReportViewModel";
import { useAuth } from "../hooks/useAuth";
import { Modal } from "../components/ui/Modal";
import { AttendanceTable } from "../components/attendance/AttendanceTable";
import { ManualCheckInForm } from "../components/attendance/ManualCheckInForm";
import { TableSkeleton } from "../components/ui/Skeleton";
import {
  QrCode,
  ClipboardList,
  Download,
  Plus,
  RefreshCw,
  Users,
  BookOpen,
  UserPlus,
  Trash2,
  Search,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Session, CreateSessionPayload } from "../models/session.model";
import type { User } from "../models/user.model";
import { userService } from "../services/user.service";
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";

type Tab = "sessions" | "students";

export default function SessionAttendanceView() {
  const { classId } = useParams<{ classId: string }>();
  const { isTeacher, isAdmin } = useAuth();
  const {
    sessions,
    loading: sessLoading,
    createSession,
    updateSession,
  } = useSessionViewModel(classId!);
  const {
    classRoom,
    students,
    loading: classLoading,
    enroll,
    unenroll,
  } = useClassDetailViewModel(classId!);
  const { exportSession } = useReportViewModel();

  const [tab, setTab] = useState<Tab>("sessions");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [showQrModal, setShowQrModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    attendance,
    loading: attLoading,
    saveManual,
    updateStatus,
    reload: reloadAtt,
  } = useAttendanceViewModel(selectedSessionId || "");
  const {
    qrData,
    loading: qrLoading,
    countdown,
    generateQr,
    loadExistingQr,
  } = useQrViewModel(selectedSessionId || "");

  const [newSession, setNewSession] = useState<CreateSessionPayload>({
    sessionNumber: 1,
    startTime: "",
    endTime: "",
    room: "",
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editForm, setEditForm] = useState<CreateSessionPayload>({
    sessionNumber: 1,
    startTime: "",
    endTime: "",
    room: "",
  });

  useEffect(() => {
    setNewSession((n) => ({ ...n, sessionNumber: sessions.length + 1 }));
  }, [sessions.length]);

  const openQrModal = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowQrModal(true);
  };

  useEffect(() => {
    if (showQrModal && selectedSessionId) {
      loadExistingQr();
    }
  }, [showQrModal, selectedSessionId]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await createSession(newSession);
    if (ok) setShowCreateModal(false);
  };

  const handleManualSave = async (rows: any[]) => {
    if (!selectedSessionId) return;
    setSaving(true);
    await saveManual({
      sessionId: selectedSessionId,
      students: rows.map((r) => ({
        studentId: r.userId,
        status: r.status,
        note: r.note,
      })),
    });
    setSaving(false);
    setShowManualModal(false);
  };

  // --- Enroll students — local state, NOT shared with StudentListView ---
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollSearch, setEnrollSearch] = useState("");
  const [enrollStudents, setEnrollStudents] = useState<User[]>([]);
  const [enrollLoading, setEnrollLoading] = useState(false);

  const debouncedEnrollSearch = useDebounce(enrollSearch, 400);

  const loadEnrollStudents = useCallback(async () => {
    setEnrollLoading(true);
    try {
      const res = await userService.list({
        role: "STUDENT",
        search: debouncedEnrollSearch || undefined,
        size: 50,
      });
      setEnrollStudents(res.content);
    } catch {
      toast.error("Không thể tải danh sách sinh viên");
    } finally {
      setEnrollLoading(false);
    }
  }, [debouncedEnrollSearch]);

  useEffect(() => {
    if (showEnrollModal) loadEnrollStudents();
  }, [showEnrollModal, loadEnrollStudents]);

  const enrolledIds = new Set(students.map((s) => s.userId));

  const handleEnroll = async (studentId: string) => {
    await enroll(studentId);
  };

  const handleUnenroll = async (studentId: string) => {
    if (confirm("Xóa sinh viên này khỏi lớp?")) {
      await unenroll(studentId);
    }
  };
  const openEditModal = (s: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSession(s);
    setEditForm({
      sessionNumber: s.sessionNumber,
      startTime: s.startTime.slice(0, 16), // cắt để hợp với datetime-local
      endTime: s.endTime.slice(0, 16),
      room: s.room,
    });
    setShowEditModal(true);
  };

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    const ok = await updateSession(editingSession.sessionId, editForm);
    if (ok) {
      setShowEditModal(false);
      setEditingSession(null);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {classRoom?.name || "..."}
          </h1>
          <p className="text-slate-500 mt-1">
            {classRoom?.course?.name} • {classRoom?.semester}{" "}
            {classRoom?.academicYear}
            {classRoom?.teacher && ` • GV: ${classRoom.teacher.fullName}`}
          </p>
        </div>
        {(isAdmin || isTeacher) && (
          <div className="flex gap-2">
            <button
              className="btn-secondary flex items-center gap-2"
              onClick={() => setShowEnrollModal(true)}
            >
              <UserPlus className="w-4 h-4" /> Thêm sinh viên
            </button>
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4" /> Tạo buổi học
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            tab === "sessions"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setTab("sessions")}
        >
          <BookOpen className="w-4 h-4" /> Buổi học ({sessions.length})
        </button>
        <button
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            tab === "students"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setTab("students")}
        >
          <Users className="w-4 h-4" /> Sinh viên ({students.length})
        </button>
      </div>

      {/* Tab: Sessions */}
      {tab === "sessions" && (
        <>
          <div className="card">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold text-slate-900">
                Danh sách buổi học
              </h2>
            </div>
            {sessLoading ? (
              <TableSkeleton rows={4} />
            ) : (
              <div className="divide-y">
                {sessions.map((s) => (
                  <div
                    key={s.sessionId}
                    className={`flex items-center px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                      selectedSessionId === s.sessionId
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : ""
                    }`}
                    onClick={() => setSelectedSessionId(s.sessionId)}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        Buổi {s.sessionNumber}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {format(
                          new Date(s.startTime),
                          "EEEE, dd/MM/yyyy HH:mm",
                          { locale: vi },
                        )}
                        {" · "} Phòng {s.room}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          s.status === "ONGOING"
                            ? "bg-green-100 text-green-700"
                            : s.status === "COMPLETED"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {s.status === "SCHEDULED"
                          ? "Chờ"
                          : s.status === "ONGOING"
                            ? "Đang học"
                            : "Kết thúc"}
                      </span>
                      {(isAdmin || isTeacher) && (
                        <>
                          <button
                            className="p-2 rounded-lg hover:bg-yellow-100 text-yellow-600"
                            title="Sửa buổi học"
                            onClick={(e) => openEditModal(s, e)}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 rounded-lg hover:bg-blue-100 text-blue-600"
                            title="Tạo QR"
                            onClick={(e) => {
                              e.stopPropagation();
                              openQrModal(s.sessionId);
                            }}
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                            title="Điểm danh thủ công"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSessionId(s.sessionId);
                              setShowManualModal(true);
                            }}
                          >
                            <ClipboardList className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                            title="Xuất Excel"
                            onClick={(e) => {
                              e.stopPropagation();
                              exportSession(s.sessionId);
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <p className="px-5 py-10 text-center text-slate-400">
                    Chưa có buổi học nào
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Attendance detail for selected session */}
          {selectedSessionId && (
            <div className="card">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">
                  Danh sách điểm danh
                </h2>
                <button
                  className="btn-secondary flex items-center gap-2 text-sm py-1.5"
                  onClick={() => reloadAtt()}
                >
                  <RefreshCw className="w-4 h-4" /> Làm mới
                </button>
              </div>
              {attLoading ? (
                <TableSkeleton />
              ) : (
                <AttendanceTable
                  data={attendance}
                  editable={isAdmin || isTeacher}
                  onStatusChange={(id, status) => updateStatus(id, status)}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Tab: Students */}
      {tab === "students" && (
        <div className="card">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              Danh sách sinh viên trong lớp
            </h2>
            {(isAdmin || isTeacher) && (
              <button
                className="btn-primary flex items-center gap-2 text-sm"
                onClick={() => setShowEnrollModal(true)}
              >
                <UserPlus className="w-4 h-4" /> Thêm sinh viên
              </button>
            )}
          </div>
          {classLoading ? (
            <TableSkeleton />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left px-5 py-3 text-slate-500 font-medium">
                      MSSV
                    </th>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium">
                      Họ tên
                    </th>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium">
                      Email
                    </th>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium">
                      SĐT
                    </th>
                    {(isAdmin || isTeacher) && <th className="px-5 py-3" />}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.userId} className="border-b hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-xs">
                        {s.studentId || "—"}
                      </td>
                      <td className="px-5 py-3 font-medium">{s.fullName}</td>
                      <td className="px-5 py-3 text-slate-500">{s.email}</td>
                      <td className="px-5 py-3 text-slate-500">
                        {s.phone || "—"}
                      </td>
                      {(isAdmin || isTeacher) && (
                        <td className="px-5 py-3">
                          <button
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Xóa khỏi lớp"
                            onClick={() => handleUnenroll(s.userId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-10 text-center text-slate-400"
                      >
                        Chưa có sinh viên nào trong lớp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* QR Modal */}
      <Modal
        open={showQrModal}
        onClose={() => setShowQrModal(false)}
        title="QR Code Điểm danh"
        size="sm"
      >
        <div className="flex flex-col items-center gap-4">
          {qrData ? (
            <>
              <img
                src={qrData.qrImageBase64}
                alt="QR Code"
                className="w-64 h-64 rounded-xl"
              />
              <div className="text-center">
                <p className="text-sm text-slate-500">Hết hạn sau</p>
                <p
                  className={`text-4xl font-bold font-mono ${countdown < 60 ? "text-red-600" : "text-blue-600"}`}
                >
                  {Math.floor(countdown / 60)
                    .toString()
                    .padStart(2, "0")}
                  :{(countdown % 60).toString().padStart(2, "0")}
                </p>
              </div>
              {countdown === 0 && (
                <p className="text-sm text-red-500">
                  QR đã hết hạn — bấm tạo mới
                </p>
              )}
            </>
          ) : (
            <div className="w-64 h-64 bg-slate-100 rounded-xl flex items-center justify-center">
              <p className="text-slate-400 text-sm text-center px-4">
                Chưa có QR. Nhấn tạo mới.
              </p>
            </div>
          )}
          <button
            className="btn-primary w-full"
            onClick={generateQr}
            disabled={qrLoading}
          >
            {qrLoading ? "Đang tạo..." : qrData ? "Tạo QR mới" : "Tạo QR Code"}
          </button>
        </div>
      </Modal>

      {/* Manual check-in modal */}
      <Modal
        open={showManualModal}
        onClose={() => setShowManualModal(false)}
        title="Điểm danh thủ công"
        size="lg"
      >
        <ManualCheckInForm
          students={students}
          sessionId={selectedSessionId || ""}
          onSubmit={handleManualSave}
          loading={saving}
        />
      </Modal>

      {/* Create session modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tạo buổi học mới"
        size="sm"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Số buổi
            </label>
            <input
              type="number"
              className="input"
              value={newSession.sessionNumber}
              onChange={(e) =>
                setNewSession((n) => ({ ...n, sessionNumber: +e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Bắt đầu
            </label>
            <input
              type="datetime-local"
              className="input"
              value={newSession.startTime}
              onChange={(e) =>
                setNewSession((n) => ({ ...n, startTime: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Kết thúc
            </label>
            <input
              type="datetime-local"
              className="input"
              value={newSession.endTime}
              onChange={(e) =>
                setNewSession((n) => ({ ...n, endTime: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Phòng học
            </label>
            <input
              className="input"
              placeholder="VD: P.101"
              value={newSession.room}
              onChange={(e) =>
                setNewSession((n) => ({ ...n, room: e.target.value }))
              }
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Huỷ
            </button>
            <button type="submit" className="btn-primary">
              Tạo buổi
            </button>
          </div>
        </form>
      </Modal>
{/* Edit session modal */}
      <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setEditingSession(null) }} title={`Sửa buổi ${editingSession?.sessionNumber}`} size="sm">
        <form onSubmit={handleUpdateSession} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Số buổi</label>
            <input type="number" className="input" value={editForm.sessionNumber}
              onChange={e => setEditForm(f => ({ ...f, sessionNumber: +e.target.value }))} required />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Bắt đầu</label>
            <input type="datetime-local" className="input" value={editForm.startTime}
              onChange={e => setEditForm(f => ({ ...f, startTime: e.target.value }))} required />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Kết thúc</label>
            <input type="datetime-local" className="input" value={editForm.endTime}
              onChange={e => setEditForm(f => ({ ...f, endTime: e.target.value }))} required />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Phòng học</label>
            <input className="input" placeholder="VD: P.101" value={editForm.room}
              onChange={e => setEditForm(f => ({ ...f, room: e.target.value }))} required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => { setShowEditModal(false); setEditingSession(null) }}>Huỷ</button>
            <button type="submit" className="btn-primary">Lưu thay đổi</button>
          </div>
        </form>
      </Modal>

      {/* Enroll students modal */}
      <Modal
        open={showEnrollModal}
        onClose={() => {
          setShowEnrollModal(false);
          setEnrollSearch("");
        }}
        title="Thêm sinh viên vào lớp"
        size="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="input pl-9"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={enrollSearch}
              onChange={(e) => setEnrollSearch(e.target.value)}
            />
          </div>

          <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="border-b">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">
                    MSSV
                  </th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">
                    Họ tên
                  </th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">
                    Email
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {enrollLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : (
                  enrollStudents.map((u) => {
                    const isEnrolled = enrolledIds.has(u.userId);
                    return (
                      <tr
                        key={u.userId}
                        className={`border-b ${isEnrolled ? "bg-green-50" : "hover:bg-slate-50"}`}
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          {u.studentId || "—"}
                        </td>
                        <td className="px-4 py-3 font-medium">{u.fullName}</td>
                        <td className="px-4 py-3 text-slate-500">{u.email}</td>
                        <td className="px-4 py-3 text-right">
                          {isEnrolled ? (
                            <span className="text-xs text-green-600 font-medium">
                              ✓ Đã vào lớp
                            </span>
                          ) : (
                            <button
                              className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
                              onClick={() => handleEnroll(u.userId)}
                            >
                              Thêm vào lớp
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
                {!enrollLoading && enrollStudents.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      Không tìm thấy sinh viên nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              className="btn-secondary"
              onClick={() => {
                setShowEnrollModal(false);
                setEnrollSearch("");
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
