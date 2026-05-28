import { useState } from 'react'
import { Sparkle } from './Icons'
import { fetchProductMeta } from '../lib/scraper'
import { useDiscounts } from '../hooks/useDiscounts'

export default function PasteLinkCard({ onFetched, onManualWithUrl, onManual }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)
  const { discounts } = useDiscounts()

  async function handleFetch(e) {
    e?.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return
    setLoading(true)
    setNotice(null)
    try {
      const meta = await fetchProductMeta(trimmed, { discounts })
      setUrl('')
      onFetched?.(meta)
    } catch (err) {
      setNotice(err.message || "We couldn't read that link.")
      onManualWithUrl?.(trimmed)
      setUrl('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-5">
      <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
        Paste a product link
      </p>
      <form onSubmit={handleFetch} className="mt-3 flex gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.westelm.com/products/..."
          disabled={loading}
          className="flex-1 rounded-lg border border-input bg-background/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-taupe px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-taupe/90 disabled:opacity-50"
        >
          <Sparkle />
          {loading ? 'Fetching…' : 'Fetch'}
        </button>
      </form>
      <button
        type="button"
        onClick={onManual}
        className="mt-3 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        or enter manually
      </button>
      {notice && (
        <p className="mt-3 rounded-lg bg-pending/10 px-3 py-2 text-xs italic text-pending">
          {notice} We opened the manual form below with your link pre-filled.
        </p>
      )}
    </div>
  )
}
