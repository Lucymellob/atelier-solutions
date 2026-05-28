import { useState } from 'react'
import Field from './Field'
import Button from './Button'

const empty = {
  name: '',
  image_url: '',
  vendor: '',
  retail_price: '',
  sale_price: '',
  quantity: 1,
  product_url: '',
}

export default function ItemForm({ initial, onSave, onCancel, submitLabel = 'Add item' }) {
  const [values, setValues] = useState({ ...empty, ...(initial || {}) })

  function set(key, val) {
    setValues((v) => ({ ...v, [key]: val }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      name: values.name.trim(),
      image_url: values.image_url?.trim() || null,
      vendor: values.vendor?.trim() || null,
      retail_price: numOrNull(values.retail_price),
      sale_price: numOrNull(values.sale_price),
      quantity: Number(values.quantity) || 1,
      product_url: values.product_url?.trim() || null,
      final_price: numOrNull(values.final_price),
      include_in_budget: values.include_in_budget !== false,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-foreground/20 bg-card p-6"
    >
      <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
        {initial ? 'Edit item' : 'Enter manually'}
      </p>

      <Field
        label="Name"
        value={values.name}
        onChange={(v) => set('name', v)}
        placeholder="Linen sofa, brass sconce…"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Vendor"
          value={values.vendor}
          onChange={(v) => set('vendor', v)}
          placeholder="RH, CB2, etc."
        />
        <Field
          label="Quantity"
          type="number"
          value={values.quantity}
          onChange={(v) => set('quantity', v)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Retail price"
          type="number"
          step="0.01"
          value={values.retail_price}
          onChange={(v) => set('retail_price', v)}
        />
        <Field
          label="Sale price"
          type="number"
          step="0.01"
          value={values.sale_price}
          onChange={(v) => set('sale_price', v)}
        />
      </div>

      <Field
        label="Image URL"
        type="url"
        value={values.image_url}
        onChange={(v) => set('image_url', v)}
        placeholder="https://"
      />

      <Field
        label="Product link"
        type="url"
        value={values.product_url}
        onChange={(v) => set('product_url', v)}
        placeholder="https://"
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

function numOrNull(v) {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
