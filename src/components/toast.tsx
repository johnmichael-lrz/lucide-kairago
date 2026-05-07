'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ToastProps {
  message: string
  visible: boolean
  onHide: () => void
}

export function Toast({ message, visible, onHide }: ToastProps) {
  useEffect(() => {
    if (!visible) return
    const id = window.setTimeout(onHide, 2500)
    return () => window.clearTimeout(id)
  }, [visible, onHide])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'fixed bottom-[72px] left-1/2 z-50 -translate-x-1/2 rounded-lg border border-white/10 bg-[var(--surface-raised)] px-4 py-2.5 text-[13px] font-medium text-white shadow-xl backdrop-blur-sm transition-all duration-300',
        visible
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0',
      )}
    >
      {message}
    </div>
  )
}
