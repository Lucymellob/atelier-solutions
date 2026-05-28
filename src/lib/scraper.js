import { matchDiscount, applyDiscount, hostnameOf } from './discounts'

export async function fetchProductMeta(url, { discounts = [] } = {}) {
  if (!url || !/^https?:\/\//i.test(url)) {
    throw new Error('Please paste a full link starting with http:// or https://')
  }

  let res
  try {
    res = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
  } catch {
    throw new Error('Could not reach the scraper. Check your internet connection.')
  }

  if (res.status === 404) {
    throw new Error(
      'Scraper not available here (only runs on the live site). Please use the deployed URL.',
    )
  }

  const payload = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(payload?.error || `Could not read that page (HTTP ${res.status}).`)
  }

  if (!payload || (!payload.name && !payload.image_url)) {
    throw new Error('That page did not return product details.')
  }

  const match = matchDiscount(url, discounts)
  const retail = payload.retail_price ?? null
  let sale = null
  let designer_discount_pct = null

  if (match && retail != null) {
    sale = applyDiscount(retail, match.discount_pct)
    designer_discount_pct = Number(match.discount_pct)
  }

  return {
    name: payload.name || '',
    vendor: match?.name || payload.vendor || hostnameOf(url),
    image_url: payload.image_url || '',
    product_url: payload.product_url || url,
    retail_price: retail,
    sale_price: sale,
    designer_discount_pct,
  }
}
