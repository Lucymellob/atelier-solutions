import { formatCurrency, grandTotal } from '../lib/pricing'

export default function BudgetSummary({ project, rooms, items }) {
  const total = grandTotal(items)
  const budget = Number(project?.budget) || 0
  const remaining = budget - total
  const over = budget > 0 && remaining < 0
  const pct = budget > 0 ? Math.min(100, (total / budget) * 100) : 0

  const byRoom = rooms.map((room) => ({
    room,
    subtotal: grandTotal(items.filter((i) => i.room_id === room.id)),
    count: items.filter((i) => i.room_id === room.id).length,
  }))

  return (
    <aside className="sticky top-8 space-y-6 rounded-2xl border border-border bg-card p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Grand total
        </p>
        <p className="mt-2 font-serif text-4xl tracking-tight text-foreground">
          {formatCurrency(total)}
        </p>
        {budget > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            of {formatCurrency(budget)} budget
          </p>
        )}
      </div>

      {budget > 0 && (
        <div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all ${
                over ? 'bg-red-500' : 'bg-clay'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p
            className={`mt-2 text-xs ${
              over ? 'text-red-600' : 'text-muted-foreground'
            }`}
          >
            {over
              ? `Over by ${formatCurrency(Math.abs(remaining))}`
              : `${formatCurrency(remaining)} remaining`}
          </p>
        </div>
      )}

      {byRoom.length > 0 && (
        <div className="space-y-2 border-t border-border pt-5">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            By room
          </p>
          <ul className="space-y-1.5">
            {byRoom.map(({ room, subtotal, count }) => (
              <li
                key={room.id}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span className="truncate text-foreground">{room.name}</span>
                <span className="text-muted-foreground tabular-nums">
                  {formatCurrency(subtotal)}
                  <span className="ml-1 text-xs">({count})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
        Totals use the final price per item, falling back to sale price, then retail.
      </p>
    </aside>
  )
}
