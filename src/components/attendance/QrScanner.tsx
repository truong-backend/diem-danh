import { useEffect, useRef, useState, useId } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, CameraOff } from 'lucide-react'

interface Props {
  onScan: (token: string) => void
  active?: boolean
}

export function QrScanner({ onScan, active = true }: Props) {
  // Dùng useId để tạo id duy nhất tránh xung đột khi render nhiều lần (React StrictMode)
  const uid = useId().replace(/:/g, '_')
  const containerId = `qr_scanner_${uid}`

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isMountedRef = useRef(true)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!active) return

    let scanner: Html5Qrcode | null = null

    // Delay nhỏ để đảm bảo DOM đã mount trước khi khởi tạo
    const timer = setTimeout(async () => {
      const el = document.getElementById(containerId)
      if (!el || !isMountedRef.current) return

      try {
        scanner = new Html5Qrcode(containerId)
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            // QR format: "ATD:<token>" hoặc raw token
            const token = decoded.startsWith('ATD:') ? decoded.substring(4) : decoded
            if (isMountedRef.current) onScan(token)
          },
          () => {} // bỏ qua lỗi từng frame
        )
        if (isMountedRef.current) setReady(true)
      } catch (err: any) {
        if (isMountedRef.current) {
          const msg = String(err)
          if (msg.includes('Permission')) {
            setError('Bạn cần cấp quyền camera để điểm danh QR')
          } else if (msg.includes('NotFound') || msg.includes('Requested device')) {
            setError('Không tìm thấy camera trên thiết bị này')
          } else {
            setError('Không thể khởi động camera. Hãy thử reload trang.')
          }
        }
      }
    }, 100)

    return () => {
      clearTimeout(timer)
      if (scanner) {
        scanner.stop().catch(() => {}).finally(() => {
          try { scanner?.clear() } catch {}
        })
      }
      scannerRef.current = null
      setReady(false)
    }
  }, [active, containerId])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Container — luôn tồn tại trong DOM khi active, Html5Qrcode cần element này */}
      <div className="relative">
        <div
          id={containerId}
          className="w-72 h-72 rounded-xl overflow-hidden bg-slate-900"
        />
        {/* Overlay loading khi camera chưa sẵn */}
        {!ready && !error && active && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 rounded-xl">
            <div className="text-center">
              <Camera className="w-8 h-8 text-slate-500 mx-auto animate-pulse" />
              <p className="text-slate-500 text-sm mt-2">Đang khởi động camera...</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-4 py-3 rounded-lg w-full max-w-xs">
          <CameraOff className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!error && (
        <p className="text-sm text-slate-500">
          {ready ? 'Hướng camera vào mã QR để điểm danh' : 'Vui lòng cho phép truy cập camera...'}
        </p>
      )}
    </div>
  )
}