import { totals, formatCurrency } from '../lib/pricing'

export default function SummaryBar({ items }) {
  const t = totals(items)
  return (
    <section className="rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-3 divide-x divide-border">
        <Pillar label="Retail" value={t.retail} />
        <Pillar label="Sale" value={t.sale} />
        <Pillar label="Confirmed" value={t.confirmed} accent />
      </div>
    </section>
  )
}

function Pillar({ label, value, accent }) {
  return (
    <div className="px-10 py-7 text-right">
      <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-3 font-serif text-4xl tracking-tight tabular-nums ${
          accent ? 'text-clay' : 'text-foreground'
        }`}
      >
        {formatCurrency(value)}
      </p>
    </div>
  )
}
