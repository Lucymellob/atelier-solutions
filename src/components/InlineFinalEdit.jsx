import { useEffect, useRef, useState } from 'react'
import { formatCurrency } from '../lib/pricing'

export default function InlineFinalEdit({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) {
      setDraft(value == null || value === '' ? '' : String(value))
      requestAnimationFrame(() => inputRef.current?.select())
    }
  }, [editing, value])

  function commit() {
    if (draft === '') {
      onSave(null)
    } else {
      const n = Number(draft)
      onSave(Number.isFinite(n) ? n : null)
    }
    setEditing(false)
  }

  function cancel() {
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        step="0.01"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') cancel()
        }}
        placeholder="0.00"
        className="w-24 rounded-md border border-clay bg-card px-2 py-1 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-clay/20"
      />
    )
  }

  if (value == null || value === '') {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="font-serif italic text-pending hover:text-pending/80"
        title="Click to set the final price"
      >
        pending
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="tabular-nums text-foreground hover:text-clay"
      title="Click to edit"
    >
      {formatCurrency(value)}
    </button>
  )
}
