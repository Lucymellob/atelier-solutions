export async function fetchProductMeta(url) {
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
      'The scraper backend is not available here (it only runs on the live site). Please use the live URL.',
    )
  }

  const payload = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(payload?.error || `Could not read that page (HTTP ${res.status}).`)
  }

  if (!payload || (!payload.name && !payload.image_url)) {
    throw new Error('That page did not return product details.')
  }

  return {
    name: payload.name || '',
    vendor: payload.vendor || '',
    image_url: payload.image_url || '',
    product_url: payload.product_url || url,
    retail_price: payload.retail_price ?? null,
  }
}
