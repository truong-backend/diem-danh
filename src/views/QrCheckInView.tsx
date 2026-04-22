import { useState } from 'react'
import { QrScanner } from '../components/attendance/QrScanner'
import { useQrCheckInViewModel } from '../viewmodels/useAttendanceViewModel'
import { CheckCircle, AlertCircle, ScanLine } from 'lucide-react'

export default function QrCheckInView() {
  const { loading, result, checkIn, reset } = useQrCheckInViewModel()
  const [scanned, setScanned] = useState(false)

  const handleScan = async (token: string) => {
    if (scanned || loading) return
    setScanned(true)
    await checkIn(token)
    // Sau 4 giây tự cho phép quét lại nếu có lỗi (không có result thành công)
    setTimeout(() => setScanned(false), 4000)
  }

  const handleScanAgain = () => {
    reset()
    setScanned(false)
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <span className="font-label uppercase tracking-[0.2em] text-[10px] font-bold text-primary-800 block mb-2">Sinh viên</span>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Điểm danh QR</h1>
        <p className="text-on-surface-variant mt-1 text-sm">Quét mã QR từ giáo viên để điểm danh</p>
      </div>

      <div className="card p-6">
        {result ? (
          // Kết quả thành công
          <div className="flex flex-col items-center gap-5 py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-xl text-on-surface">Điểm danh thành công!</p>
              {result.session && (
                <p className="text-sm text-on-surface-variant">
                  Buổi {result.session.sessionNumber} • {result.session.className}
                </p>
              )}
              <p className="text-sm mt-2">
                Trạng thái:{' '}
                <span className={`font-semibold ${result.status === 'PRESENT' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {result.status === 'PRESENT' ? '✅ Có mặt' : '⏰ Muộn'}
                </span>
              </p>
              {result.checkedInAt && (
                <p className="text-xs text-on-surface-variant/60 mt-1">
                  Lúc {new Date(result.checkedInAt).toLocaleTimeString('vi-VN')}
                </p>
              )}
            </div>
            <button
              className="btn-primary flex items-center gap-2 mt-2"
              onClick={handleScanAgain}
            >
              <ScanLine className="w-4 h-4" />
              Quét buổi khác
            </button>
          </div>
        ) : (
          // Camera scanner
          <>
            <QrScanner onScan={handleScan} active={!scanned && !loading} />
            {loading && (
              <div className="flex items-center justify-center gap-2 mt-4 text-primary-800 text-sm">
                <div className="w-4 h-4 border-2 border-primary-800 border-t-transparent rounded-full animate-spin" />
                Đang xử lý điểm danh...
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-4 p-4 bg-primary-100 rounded-2xl text-sm text-primary-700">
        <p className="font-medium mb-1">Hướng dẫn</p>
        <ul className="space-y-1 text-primary-800 list-disc list-inside">
          <li>Mã QR do giáo viên tạo và hiển thị trên màn hình</li>
          <li>Mỗi mã QR chỉ dùng được một lần và có thời hạn</li>
          <li>Điểm danh được ghi nhận theo giờ quét mã</li>
        </ul>
      </div>
    </div>
  )
}