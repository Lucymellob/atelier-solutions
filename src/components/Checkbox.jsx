import { Check } from './Icons'

export default function Checkbox({ checked, onChange, label, id }) {
  const inputId = id || `cb-${Math.random().toString(36).slice(2, 9)}`
  return (
    <label
      htmlFor={inputId}
      className="inline-flex cursor-pointer select-none items-center gap-2 text-sm text-foreground"
    >
      <span className="relative">
        <input
          id={inputId}
          type="checkbox"
          checked={!!checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={`flex h-4 w-4 items-center justify-center rounded-[3px] border transition-colors ${
            checked
              ? 'border-foreground bg-foreground text-background'
              : 'border-border bg-card text-transparent'
          }`}
        >
          <Check size={10} />
        </span>
      </span>
      {label && <span>{label}</span>}
    </label>
  )
}
