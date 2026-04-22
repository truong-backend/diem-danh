import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' }

export function Modal({ open, onClose, title, children, size = 'md' }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className={`bg-surface-container-lowest rounded-2xl shadow-editorial-lg border border-outline-variant/20 w-full ${sizeMap[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/15">
          <h3 className="font-headline font-bold text-on-surface">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-surface-container transition-colors">
            <X className="w-4 h-4 text-on-surface-variant" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}