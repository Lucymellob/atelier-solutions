import { ExternalLink, Duplicate, Trash } from './Icons'
import Checkbox from './Checkbox'
import InlineFinalEdit from './InlineFinalEdit'
import { unitTotal, qty, formatCurrency } from '../lib/pricing'

export default function ItemCard({
  item,
  onUpdate,
  onDuplicate,
  onDelete,
}) {
  const total = unitTotal(item) * qty(item)
  const retail = item.retail_price
  const sale = item.sale_price
  const hasSale = sale != null && sale !== ''

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex gap-6">
        <div className="h-28 w-28 flex-none overflow-hidden rounded-xl bg-muted">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-serif text-2xl tracking-tight text-foreground">
                {item.name || 'Untitled item'}
              </h3>
              {item.vendor && (
                <p className="mt-1 font-serif italic text-muted-foreground">
                  {item.vendor}
                </p>
              )}
            </div>
            <div className="flex flex-none items-center gap-1 text-muted-foreground">
              {item.product_url && (
                <a
                  href={item.product_url}
                  target="_blank"
                  rel="noreferrer"
                  title="Open product page"
                  className="rounded-md p-1.5 hover:bg-muted hover:text-foreground"
                >
                  <ExternalLink />
                </a>
              )}
              <button
                type="button"
                onClick={onDuplicate}
                title="Duplicate"
                className="rounded-md p-1.5 hover:bg-muted hover:text-foreground"
              >
                <Duplicate />
              </button>
              <button
                type="button"
                onClick={onDelete}
                title="Delete"
                className="rounded-md p-1.5 hover:bg-muted hover:text-red-600"
              >
                <Trash />
              </button>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-5 gap-4 text-sm">
            <Cell label="Qty" value={qty(item)} />
            <Cell
              label="Retail"
              value={retail != null && retail !== '' ? formatCurrency(retail) : '—'}
              strike={hasSale}
            />
            <Cell
              label="Sale"
              value={hasSale ? formatCurrency(sale) : '—'}
            />
            <div>
              <dt className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Final
              </dt>
              <dd className="mt-1">
                <InlineFinalEdit
                  value={item.final_price}
                  onSave={(val) => onUpdate({ final_price: val })}
                />
              </dd>
            </div>
            <Cell
              label="Total"
              value={total > 0 ? formatCurrency(total) : '$0'}
              emphasize
            />
          </dl>

          <div className="mt-5 border-t border-border pt-4">
            <Checkbox
              checked={item.include_in_budget !== false}
              onChange={(checked) => onUpdate({ include_in_budget: checked })}
              label="Include in budget"
            />
          </div>
        </div>
      </div>
    </article>
  )
}

function Cell({ label, value, strike, emphasize }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </dt>
      <dd
        className={`mt-1 tabular-nums ${
          emphasize ? 'font-medium text-foreground' : 'text-foreground'
        } ${strike ? 'text-muted-foreground line-through' : ''}`}
      >
        {value}
      </dd>
    </div>
  )
}
