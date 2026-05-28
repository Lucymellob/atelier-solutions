import { useEffect, useRef, useState } from 'react'

export default function InlineEdit({
  value,
  onSave,
  type = 'text',
  step,
  placeholder = '—',
  format,
  display,
  className = '',
  inputClassName = '',
  multiline = false,
  emptyLabel,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (editing) {
      setDraft(value == null ? '' : String(value))
      requestAnimationFrame(() => ref.current?.focus())
    }
  }, [editing, value])

  function commit() {
    const next = normalize(draft, type)
    if (!isEqual(next, value)) {
      onSave(next)
    }
    setEditing(false)
  }

  function cancel() {
    setEditing(false)
  }

  if (editing) {
    const baseInput =
      'w-full rounded-md border border-clay bg-card px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-clay/20'
    if (multiline) {
      return (
        <textarea
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit()
            if (e.key === 'Escape') cancel()
          }}
          rows={2}
          className={`${baseInput} ${inputClassName}`}
        />
      )
    }
    return (
      <input
        ref={ref}
        type={type}
        step={step}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') cancel()
        }}
        placeholder={placeholder}
        className={`${baseInput} ${inputClassName}`}
      />
    )
  }

  const isEmpty = value == null || value === ''
  const text = isEmpty
    ? emptyLabel ?? placeholder
    : display
    ? display(value)
    : format
    ? format(value)
    : String(value)

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`${className} text-left ${
        isEmpty ? 'italic text-muted-foreground' : ''
      } hover:bg-muted/60 rounded px-1 -mx-1`}
      title="Click to edit"
    >
      {text}
    </button>
  )
}

function normalize(draft, type) {
  if (type === 'number') {
    if (draft === '' || draft == null) return null
    const n = Number(draft)
    return Number.isFinite(n) ? n : null
  }
  const s = String(draft).trim()
  return s === '' ? null : s
}

function isEqual(a, b) {
  if (a === b) return true
  if (a == null && (b === '' || b == null)) return true
  if (b == null && (a === '' || a == null)) return true
  return false
}
