export default function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  step,
  required,
  hint,
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step={step}
        required={required}
        className="mt-2 w-full rounded-lg border border-input bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground/70 focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20"
      />
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}
