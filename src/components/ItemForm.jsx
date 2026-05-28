import { useState } from 'react'
import Field from './Field'
import Button from './Button'

const empty = {
  name: '',
  image_url: '',
  vendor: '',
  specs: '',
  retail_price: '',
  sale_price: '',
  quantity: 1,
  product_url: '',
  final_price: '',
  include_in_budget: true,
  designer_discount_pct: null,
}

export default function ItemForm({ initial, onSave, onCancel, submitLabel = 'Add to project' }) {
  const [values, setValues] = useState({ ...empty, ...(initial || {}) })

  function set(key, val) {
    setValues((v) => ({ ...v, [key]: val }))
  }

  function setRetail(v) {
    setValues((cur) => {
      const next = { ...cur, retail_price: v }
      const pct = Number(cur.designer_discount_pct)
      const retail = Number(v)
      const saleEmpty = cur.sale_price === '' || cur.sale_price == null
      if (
        saleEmpty &&
        Number.isFinite(pct) &&
        pct > 0 &&
        Number.isFinite(retail) &&
        retail > 0
      ) {
        next.sale_price = Math.round(retail * (1 - pct / 100) * 100) / 100
      }
      return next
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      name: values.name.trim(),
      image_url: values.image_url?.trim() || null,
      vendor: values.vendor?.trim() || null,
      specs: values.specs?.trim() || null,
      retail_price: numOrNull(values.retail_price),
      sale_price: numOrNull(values.sale_price),
      quantity: Number(values.quantity) || 1,
      product_url: values.product_url?.trim() || null,
      final_price: numOrNull(values.final_price),
      include_in_budget: values.include_in_budget !== false,
      designer_discount_pct:
        values.designer_discount_pct != null ? Number(values.designer_discount_pct) : null,
    })
  }

  const hostname = prettyHostname(values.product_url)
  const discountPct =
    values.designer_discount_pct != null ? Number(values.designer_discount_pct) : null

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-foreground/20 bg-card p-6"
    >
      <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
        {initial?.name ? 'Review and add' : 'Enter manually'}
      </p>

      <div className="flex gap-5">
        <div className="h-28 w-28 flex-none overflow-hidden rounded-xl bg-muted">
          {values.image_url ? (
            <img
              src={values.image_url}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : null}
        </div>
        <div className="flex-1 space-y-4">
          <Field
            label="Item name"
            value={values.name}
            onChange={(v) => set('name', v)}
            placeholder="Linen sofa, brass sconce…"
            required
          />
          <Field
            label="Vendor"
            value={values.vendor}
            onChange={(v) => set('vendor', v)}
            placeholder="West Elm, CB2…"
          />
        </div>
      </div>

      <Field
        label="Specs"
        value={values.specs}
        onChange={(v) => set('specs', v)}
        placeholder="Fabric, dimensions, finish…"
        hint="Scraped from the page when available — editable anytime."
      />

      <div className="grid grid-cols-3 gap-4">
        <Field
          label="Quantity"
          type="number"
          value={values.quantity}
          onChange={(v) => set('quantity', v)}
        />
        <Field
          label="Retail $"
          type="number"
          step="0.01"
          value={values.retail_price}
          onChange={setRetail}
        />
        <div>
          <Field
            label="Sale $"
            type="number"
            step="0.01"
            value={values.sale_price}
            onChange={(v) => set('sale_price', v)}
          />
          {discountPct != null && discountPct > 0 && (
            <p className="mt-1 text-[10px] italic text-muted-foreground">
              Designer discount {discountPct}%
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        {hostname ? (
          <a
            href={values.product_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            🔗 {hostname}
          </a>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm">
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}

function prettyHostname(url) {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function numOrNull(v) {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
