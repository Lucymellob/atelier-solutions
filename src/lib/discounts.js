export function hostnameOf(url) {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

export function matchDiscount(url, discounts) {
  const host = hostnameOf(url)
  if (!host || !Array.isArray(discounts)) return null
  return (
    discounts.find((d) => {
      const dom = String(d.domain || '').toLowerCase().replace(/^www\./, '')
      return dom && (host === dom || host.endsWith('.' + dom) || host.includes(dom))
    }) || null
  )
}

export function applyDiscount(retailPrice, discountPct) {
  const r = Number(retailPrice)
  const p = Number(discountPct)
  if (!Number.isFinite(r) || !Number.isFinite(p) || r <= 0 || p <= 0) return null
  return Math.round(r * (1 - p / 100) * 100) / 100
}

export function effectiveDiscount(item, discounts) {
  if (item?.designer_discount_pct != null && Number(item.designer_discount_pct) > 0) {
    return Number(item.designer_discount_pct)
  }
  if (item?.product_url) {
    const m = matchDiscount(item.product_url, discounts)
    if (m) return Number(m.discount_pct)
  }
  if (item?.vendor && Array.isArray(discounts)) {
    const v = String(item.vendor).toLowerCase().trim()
    const m = discounts.find(
      (d) =>
        String(d.name).toLowerCase().trim() === v ||
        String(d.name).toLowerCase().replace(/\s+/g, '') === v.replace(/\s+/g, ''),
    )
    if (m) return Number(m.discount_pct)
  }
  return null
}
