const base =
  'inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50'

const variants = {
  primary: 'bg-foreground text-background hover:bg-foreground/85',
  secondary: 'border border-border bg-card text-foreground hover:bg-muted',
  ghost: 'text-foreground hover:bg-muted',
  clay: 'bg-clay text-background hover:bg-clay/90',
  danger:
    'border border-border bg-card text-foreground hover:border-red-300 hover:text-red-700',
}

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-5',
  lg: 'h-11 px-6',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <button
      {...props}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    />
  )
}
