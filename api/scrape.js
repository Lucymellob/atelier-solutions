export default async function handler(req, res) {
  const url = req.method === 'POST' ? req.body?.url : req.query?.url

  if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: 'Provide a full URL starting with http(s)://' })
  }

  const key = process.env.SCRAPERAPI_KEY
  if (!key) {
    return res.status(500).json({ error: 'Scraper not configured. Add SCRAPERAPI_KEY env var.' })
  }

  const scraperUrl = `https://api.scraperapi.com/?api_key=${key}&country_code=us&url=${encodeURIComponent(url)}`

  let html
  try {
    const r = await fetch(scraperUrl)
    if (!r.ok) {
      return res.status(502).json({ error: `Scraper returned ${r.status}` })
    }
    html = await r.text()
  } catch (err) {
    return res.status(502).json({ error: 'Could not reach the page.' })
  }

  const meta = parseMeta(html, url)
  return res.status(200).json(meta)
}

function parseMeta(html, sourceUrl) {
  const title =
    metaTag(html, 'og:title') ||
    metaTag(html, 'twitter:title') ||
    htmlTitle(html) ||
    ''

  const image =
    metaTag(html, 'og:image') ||
    metaTag(html, 'twitter:image') ||
    metaTag(html, 'twitter:image:src') ||
    ''

  const description =
    metaTag(html, 'og:description') ||
    metaTag(html, 'description') ||
    ''

  const siteName = metaTag(html, 'og:site_name') || ''

  const ogUrl = metaTag(html, 'og:url') || sourceUrl

  const price =
    extractMetaPrice(html) ??
    extractJsonLdPrice(html) ??
    extractPriceFromText(description) ??
    extractPriceFromText(title) ??
    null

  return {
    name: cleanTitle(title),
    vendor: siteName || hostnamePretty(sourceUrl),
    image_url: absoluteUrl(image, sourceUrl) || '',
    product_url: absoluteUrl(ogUrl, sourceUrl) || sourceUrl,
    retail_price: price,
  }
}

function metaTag(html, name) {
  const variants = [name]
  if (name.startsWith('og:') || name.startsWith('twitter:') || name.startsWith('product:')) {
    variants.push(name)
  }
  for (const n of variants) {
    const re1 = new RegExp(
      `<meta[^>]+(?:property|name)=["']${escapeRegex(n)}["'][^>]*content=["']([^"']+)["']`,
      'i',
    )
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${escapeRegex(n)}["']`,
      'i',
    )
    const m = html.match(re1) || html.match(re2)
    if (m) return decodeEntities(m[1])
  }
  return null
}

function htmlTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return m ? decodeEntities(m[1]) : null
}

function cleanTitle(t) {
  if (!t) return ''
  return String(t).split(/\s+[|·–—-]\s+/)[0].trim()
}

function hostnamePretty(url) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '')
    const main = h.split('.')[0]
    return main.charAt(0).toUpperCase() + main.slice(1)
  } catch {
    return ''
  }
}

function absoluteUrl(maybeUrl, base) {
  if (!maybeUrl) return ''
  try {
    return new URL(maybeUrl, base).href
  } catch {
    return ''
  }
}

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractMetaPrice(html) {
  const tags = [
    'product:price:amount',
    'og:price:amount',
    'twitter:data1',
  ]
  for (const t of tags) {
    const v = metaTag(html, t)
    const n = parsePriceString(v)
    if (n != null) return n
  }
  return null
}

function extractJsonLdPrice(html) {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1].trim())
      const price = findPriceDeep(data)
      if (price != null) return price
    } catch {
      // skip malformed JSON-LD
    }
  }
  return null
}

function findPriceDeep(obj) {
  if (!obj || typeof obj !== 'object') return null
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const v = findPriceDeep(item)
      if (v != null) return v
    }
    return null
  }
  for (const [k, v] of Object.entries(obj)) {
    if (/^price$/i.test(k) && (typeof v === 'number' || typeof v === 'string')) {
      const n = parsePriceString(v)
      if (n != null) return n
    }
    if (typeof v === 'object') {
      const n = findPriceDeep(v)
      if (n != null) return n
    }
  }
  return null
}

function extractPriceFromText(text) {
  if (!text) return null
  const m = String(text).match(/\$\s?([\d,]+(?:\.\d{2})?)/)
  if (!m) return null
  return parsePriceString(m[1])
}

function parsePriceString(v) {
  if (v == null) return null
  const n = Number(String(v).replace(/[$,]/g, '').trim())
  return Number.isFinite(n) && n > 0 ? n : null
}
