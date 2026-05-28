import { useState } from 'react'
import { ExternalLink, Duplicate, Trash, Pencil } from './Icons'
import Checkbox from './Checkbox'
import InlineEdit from './InlineEdit'
import InlineFinalEdit from './InlineFinalEdit'
import ImageEditModal from './ImageEditModal'
import { lineTotal, qty, formatCurrency } from '../lib/pricing'
import { effectiveDiscount, applyDiscount } from '../lib/discounts'
import { decodeEntities } from '../lib/textClean'

export default function ItemCard({
  item,
  discounts = [],
  onUpdate,
  onDuplicate,
  onDelete,
}) {
  const [imgOpen, setImgOpen] = useState(false)
  const total = lineTotal(item)
  const hasSale = item.sale_price != null && item.sale_price !== ''
  const discountPct = effectiveDiscount(item, discounts)

  const cleanName = decodeEntities(item.name)
  const cleanVendor = decodeEntities(item.vendor)
  const cleanSpecs = decodeEntities(item.specs)

  function handleRetailSave(v) {
    const patch = { retail_price: v }
    const retail = Number(v)
    if (discountPct != null && discountPct > 0 && Number.isFinite(retail) && retail > 0) {
      const expectedFromPrior =
        item.retail_price != null
          ? applyDiscount(item.retail_price, discountPct)
          : null
      const saleIsEmpty = item.sale_price == null || item.sale_price === ''
      const saleMatchesAuto =
        expectedFromPrior != null &&
        Number(item.sale_price) === Number(expectedFromPrior)
      if (saleIsEmpty || saleMatchesAuto) {
        patch.sale_price = applyDiscount(retail, discountPct)
      }
      if (item.designer_discount_pct == null) {
        patch.designer_discount_pct = discountPct
      }
    }
    onUpdate(patch)
  }

  function handleNameSave(v) {
    onUpdate({ name: v == null ? null : decodeEntities(v) })
  }

  function handleVendorSave(v) {
    onUpdate({ vendor: v == null ? null : decodeEntities(v) })
  }

  function handleSpecsSave(v) {
    onUpdate({ specs: v == null ? null : decodeEntities(v) })
  }

  return (
    <article className="group rounded-2xl border border-border bg-card p-5">
      <div className="flex gap-6">
        <button
          type="button"
          onClick={() => setImgOpen(true)}
          className="group/img relative h-28 w-28 flex-none overflow-hidden rounded-xl bg-muted"
          title="Click to change image"
        >
          {item.image_url ? (
            <img
              src={item.image_url}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              add image
            </span>
          )}
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-foreground/40 text-[10px] uppercase tracking-[0.22em] text-background opacity-0 transition-opacity group-hover/img:opacity-100">
            Change
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <InlineEdit
                value={cleanName}
                onSave={handleNameSave}
                placeholder="Untitled item"
                emptyLabel="Untitled item"
                className="block font-serif text-2xl tracking-tight text-foreground w-full"
                inputClassName="font-serif text-2xl"
              />
              <InlineEdit
                value={cleanVendor}
                onSave={handleVendorSave}
                placeholder="Add vendor"
                emptyLabel="Add vendor"
                className="mt-1 block font-serif italic text-muted-foreground"
              />
              <InlineEdit
                value={cleanSpecs}
                onSave={handleSpecsSave}
                placeholder="Add specs (fabric, dimensions, finish…)"
                emptyLabel="Add specs"
                className="mt-1 block text-xs text-muted-foreground"
                multiline
              />
            </div>
            <div className="flex flex-none items-center gap-1 text-muted-foreground">
              <span
                className="rounded-md p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                title="Every field is editable — click to change"
              >
                <Pencil />
              </span>
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

          <dl className="mt-5 grid grid-cols-6 gap-3 text-sm">
            <Cell label="Qty">
              <InlineEdit
                type="number"
                value={item.quantity ?? 1}
                onSave={(v) => onUpdate({ quantity: v ?? 1 })}
                placeholder="1"
                className="tabular-nums"
                inputClassName="tabular-nums"
              />
            </Cell>
            <Cell label="Retail" strike={hasSale}>
              <InlineEdit
                type="number"
                step="0.01"
                value={item.retail_price}
                onSave={handleRetailSave}
                placeholder="—"
                format={(v) => formatCurrency(v)}
                className="tabular-nums"
                inputClassName="tabular-nums"
              />
            </Cell>
            <Cell label="Sale">
              <InlineEdit
                type="number"
                step="0.01"
                value={item.sale_price}
                onSave={(v) => onUpdate({ sale_price: v })}
                placeholder="—"
                format={(v) => formatCurrency(v)}
                className="tabular-nums"
                inputClassName="tabular-nums"
              />
              {discountPct != null && discountPct > 0 && (
                <p className="mt-1 text-[10px] italic text-muted-foreground">
                  Designer discount {discountPct}%
                </p>
              )}
            </Cell>
            <Cell label="Final">
              <InlineFinalEdit
                value={item.final_price}
                defaultDraft={item.sale_price}
                onSave={(val) => onUpdate({ final_price: val })}
              />
            </Cell>
            <Cell label="Shipping">
              <InlineEdit
                type="number"
                step="0.01"
                value={item.shipping}
                onSave={(v) => onUpdate({ shipping: v })}
                placeholder="—"
                format={(v) => formatCurrency(v)}
                className="tabular-nums"
                inputClassName="tabular-nums"
              />
            </Cell>
            <Cell label="Total" emphasize>
              <span className="tabular-nums">
                {total > 0 ? formatCurrency(total) : '$0'}
              </span>
            </Cell>
          </dl>

          {item.product_url && (
            <div className="mt-3">
              <InlineEdit
                value={item.product_url}
                onSave={(v) => onUpdate({ product_url: v })}
                placeholder="Add product link"
                emptyLabel="Add product link"
                format={(v) => shortenUrl(v)}
                className="text-xs text-muted-foreground"
              />
            </div>
          )}

          <div className="mt-5 border-t border-border pt-4">
            <Checkbox
              checked={item.include_in_budget !== false}
              onChange={(checked) => onUpdate({ include_in_budget: checked })}
              label="Include in budget"
            />
          </div>
        </div>
      </div>

      <ImageEditModal
        open={imgOpen}
        currentUrl={item.image_url}
        onClose={() => setImgOpen(false)}
        onSave={(url) => onUpdate({ image_url: url })}
      />
    </article>
  )
}

function Cell({ label, children, strike, emphasize }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </dt>
      <dd
        className={`mt-1 ${emphasize ? 'font-medium text-foreground' : 'text-foreground'} ${
          strike ? 'text-muted-foreground line-through' : ''
        }`}
      >
        {children}
      </dd>
    </div>
  )
}

function shortenUrl(url) {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '') + (u.pathname.length > 1 ? '…' : '')
  } catch {
    return url
  }
}
