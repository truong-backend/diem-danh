import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { attendanceService } from "../services/attendance.service";
import type { Attendance } from "../models/attendance.model";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ClipboardList } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  PRESENT: "Có mặt",
  ABSENT: "Vắng",
  LATE: "Trễ",
  EXCUSED: "Có phép",
};

const STATUS_COLOR: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-800",
  ABSENT: "bg-red-100 text-red-800",
  LATE: "bg-yellow-100 text-yellow-800",
  EXCUSED: "bg-blue-100 text-blue-800",
};

export default function StudentAttendanceHistoryView() {
  const { user } = useAuth();
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.userId) return;
    setLoading(true);
    attendanceService
      .studentHistory(user.userId)
      .then(setRecords)
      .finally(() => setLoading(false));
  }, [user?.userId]);

  const stats = {
    total: records.length,
    present: records.filter((r) => r.status === "PRESENT").length,
    late: records.filter((r) => r.status === "LATE").length,
    absent: records.filter((r) => r.status === "ABSENT").length,
    excused: records.filter((r) => r.status === "EXCUSED").length,
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div>
        <span className="font-label uppercase tracking-[0.2em] text-[10px] font-bold text-primary-800 block mb-1">
          Sinh viên
        </span>
        <h1 className="font-headline text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
          Lịch sử điểm danh
        </h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          Tổng hợp các buổi học đã điểm danh của bạn
        </p>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng buổi", value: stats.total, color: "text-on-surface" },
          { label: "Có mặt", value: stats.present, color: "text-green-700" },
          { label: "Trễ", value: stats.late, color: "text-yellow-700" },
          { label: "Vắng", value: stats.absent, color: "text-red-700" },
        ].map((s) => (
          <div key={s.label} className="card px-5 py-4 text-center">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bảng */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/10">
          <h2 className="font-semibold text-on-surface flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Danh sách buổi học
          </h2>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-on-surface-variant/60">
            Đang tải...
          </div>
        ) : records.length === 0 ? (
          <div className="px-5 py-10 text-center text-on-surface-variant/60">
            Chưa có dữ liệu điểm danh
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container/40 text-left text-xs text-on-surface-variant font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3">Lớp học</th>
                  <th className="px-5 py-3">Buổi</th>
                  <th className="px-5 py-3">Thời gian</th>
                  <th className="px-5 py-3">Check-in lúc</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3">Phương thức</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {records.map((r) => (
                  <tr
                    key={r.attendanceId}
                    className="hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-on-surface">
                      {r.session?.className ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-on-surface-variant">
                      Buổi {r.session?.sessionNumber ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-on-surface-variant">
                      {r.session?.startTime
                        ? format(new Date(r.session.startTime), "dd/MM/yyyy HH:mm", { locale: vi })
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-on-surface-variant">
                      {r.checkedInAt
                        ? format(new Date(r.checkedInAt), "HH:mm dd/MM/yyyy", { locale: vi })
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[r.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-on-surface-variant text-xs">
                      {r.method === "QR_CODE" ? "QR Code" : "Thủ công"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}