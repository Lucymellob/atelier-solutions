import { totals, formatCurrency } from '../lib/pricing'

export default function SummaryBar({ items }) {
  const t = totals(items)
  return (
    <section className="rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-4 divide-x divide-border">
        <Pillar label="Retail" value={t.retail} />
        <Pillar label="Sale" value={t.sale} />
        <Pillar label="Shipping" value={t.shipping} muted />
        <Pillar label="Confirmed" value={t.confirmed} accent />
      </div>
    </section>
  )
}

function Pillar({ label, value, accent, muted }) {
  return (
    <div className="px-8 py-6 text-right">
      <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-3 font-serif text-3xl tracking-tight tabular-nums ${
          accent ? 'text-clay' : muted ? 'text-muted-foreground' : 'text-foreground'
        }`}
      >
        {formatCurrency(value)}
      </p>
    </div>
  )
}
