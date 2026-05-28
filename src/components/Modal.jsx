import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="font-serif text-3xl tracking-tight text-foreground">
            {title}
          </h2>
        )}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-8 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  )
}
