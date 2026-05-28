const ENDPOINT = 'https://api.microlink.io/'

export async function fetchProductMeta(url) {
  if (!url || !/^https?:\/\//i.test(url)) {
    throw new Error('Please paste a full link starting with http:// or https://')
  }

  let res
  try {
    res = await fetch(`${ENDPOINT}?url=${encodeURIComponent(url)}`)
  } catch {
    throw new Error('Could not reach the link. Check your internet connection.')
  }

  if (!res.ok) {
    throw new Error(`Could not read that page (HTTP ${res.status}).`)
  }

  const payload = await res.json().catch(() => null)
  if (!payload || payload.status !== 'success' || !payload.data) {
    throw new Error('That page did not return product details.')
  }

  const data = payload.data
  return {
    name: cleanTitle(data.title) || '',
    vendor: data.publisher || hostname(url) || '',
    image_url: data.image?.url || data.logo?.url || '',
    product_url: data.url || url,
    retail_price: extractPrice(data.description) ?? extractPrice(data.title) ?? null,
  }
}

function cleanTitle(t) {
  if (!t) return ''
  return String(t).split(/\s+[|–—-]\s+/)[0].trim()
}

function hostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function extractPrice(text) {
  if (!text) return null
  const match = String(text).match(/\$\s?([\d,]+(?:\.\d{2})?)/)
  if (!match) return null
  const n = Number(match[1].replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}
