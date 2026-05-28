import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from '../hooks/useDiscounts'
import InlineEdit from '../components/InlineEdit'
import Button from '../components/Button'
import Field from '../components/Field'
import { Trash } from '../components/Icons'

export default function Settings() {
  const { discounts, loading } = useDiscounts()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', domain: '', discount_pct: '' })

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.domain.trim() || form.discount_pct === '') return
    await createDiscount(form)
    setForm({ name: '', domain: '', discount_pct: '' })
    setOpen(false)
  }

  async function handleDelete(d) {
    if (!confirm(`Remove ${d.name} from discount list?`)) return
    await deleteDiscount(d.id)
  }

  return (
    <section className="mx-auto max-w-4xl px-8 py-12">
      <Link
        to="/"
        className="text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground"
      >
        ← Projects
      </Link>

      <header className="mt-6 border-b border-border pb-8">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Settings
        </p>
        <h1 className="mt-2 font-serif text-5xl tracking-tight text-foreground">
          Designer discounts
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          When a product URL is fetched from one of these retailers, the sale price is
          automatically calculated from the retail price using the discount below. Changes
          apply to future fetched items.
        </p>
      </header>

      <div className="mt-10 rounded-2xl border border-border bg-card">
        <div className="grid grid-cols-[1fr_1fr_100px_60px] gap-4 border-b border-border px-6 py-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>Vendor</span>
          <span>Domain</span>
          <span className="text-right">Discount</span>
          <span></span>
        </div>

        {loading ? (
          <p className="px-6 py-6 text-sm text-muted-foreground">Loading…</p>
        ) : discounts.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            No vendors yet. Add your first one below.
          </p>
        ) : (
          <ul>
            {discounts.map((d) => (
              <li
                key={d.id}
                className="grid grid-cols-[1fr_1fr_100px_60px] items-center gap-4 border-b border-border px-6 py-4 text-sm last:border-b-0"
              >
                <InlineEdit
                  value={d.name}
                  onSave={(v) => updateDiscount(d.id, { name: v })}
                  placeholder="Vendor name"
                  className="font-medium text-foreground"
                />
                <InlineEdit
                  value={d.domain}
                  onSave={(v) => updateDiscount(d.id, { domain: v })}
                  placeholder="domain.com"
                  className="text-muted-foreground"
                />
                <div className="text-right tabular-nums">
                  <InlineEdit
                    type="number"
                    step="0.5"
                    value={d.discount_pct}
                    onSave={(v) => updateDiscount(d.id, { discount_pct: v })}
                    placeholder="0"
                    format={(v) => `${Number(v)}%`}
                    className="text-foreground"
                    inputClassName="text-right tabular-nums"
                  />
                </div>
                <button
                  onClick={() => handleDelete(d)}
                  title="Remove"
                  className="justify-self-end rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-red-600"
                >
                  <Trash />
                </button>
              </li>
            ))}
          </ul>
        )}

        {open ? (
          <form onSubmit={handleAdd} className="grid grid-cols-[1fr_1fr_100px_60px] items-end gap-4 border-t border-border px-6 py-4">
            <Field
              label="Vendor"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="Restoration Hardware"
              required
            />
            <Field
              label="Domain"
              value={form.domain}
              onChange={(v) => setForm({ ...form, domain: v })}
              placeholder="rh.com"
              required
            />
            <Field
              label="%"
              type="number"
              step="0.5"
              value={form.discount_pct}
              onChange={(v) => setForm({ ...form, discount_pct: v })}
              placeholder="20"
              required
            />
            <div className="flex flex-col gap-1">
              <Button type="submit" size="sm">
                Save
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="border-t border-border px-6 py-4">
            <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
              + Add vendor
            </Button>
          </div>
        )}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Tip: click any field above to edit it. Changes save when you click away.
      </p>
    </section>
  )
}
