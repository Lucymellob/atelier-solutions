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
    if (!r.ok) return res.status(502).json({ error: `Scraper returned ${r.status}` })
    html = await r.text()
  } catch {
    return res.status(502).json({ error: 'Could not reach the page.' })
  }

  return res.status(200).json(parseMeta(html, url))
}

function parseMeta(html, sourceUrl) {
  const title =
    metaTag(html, 'og:title') ||
    metaTag(html, 'twitter:title') ||
    htmlTitle(html) ||
    ''

  const description =
    metaTag(html, 'og:description') ||
    metaTag(html, 'description') ||
    ''

  const siteName = metaTag(html, 'og:site_name') || ''
  const ogUrl = metaTag(html, 'og:url') || sourceUrl

  const images = collectImages(html, sourceUrl)
  const bestImage = pickBestImage(images)

  const price =
    extractMetaPrice(html) ??
    extractJsonLdPrice(html) ??
    extractPriceFromText(description) ??
    extractPriceFromText(title) ??
    null

  return {
    name: cleanTitle(title),
    vendor: siteName || hostnamePretty(sourceUrl),
    image_url: bestImage || '',
    image_candidates: images.slice(0, 6),
    product_url: absoluteUrl(ogUrl, sourceUrl) || sourceUrl,
    retail_price: price,
  }
}

function collectImages(html, sourceUrl) {
  const names = ['og:image', 'og:image:secure_url', 'twitter:image', 'twitter:image:src']
  const set = new Set()
  for (const n of names) {
    for (const u of metaTagAll(html, n)) {
      const abs = absoluteUrl(u, sourceUrl)
      if (abs) set.add(abs)
    }
  }
  return [...set]
}

function pickBestImage(images) {
  if (!images.length) return ''
  const keywords = /white|clean|studio|flat/i
  const scored = images.map((url, i) => ({
    url,
    score: keywords.test(url) ? 10 : 0,
    order: i,
  }))
  scored.sort((a, b) => b.score - a.score || a.order - b.order)
  return scored[0].url
}

function metaTag(html, name) {
  const re1 = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escapeRegex(name)}["'][^>]*content=["']([^"']+)["']`,
    'i',
  )
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${escapeRegex(name)}["']`,
    'i',
  )
  const m = html.match(re1) || html.match(re2)
  return m ? decodeEntities(m[1]) : null
}

function metaTagAll(html, name) {
  const out = []
  const seen = new Set()
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escapeRegex(name)}["'][^>]*content=["']([^"']+)["']`,
      'gi',
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${escapeRegex(name)}["']`,
      'gi',
    ),
  ]
  for (const re of patterns) {
    let m
    while ((m = re.exec(html)) !== null) {
      const v = decodeEntities(m[1])
      if (!seen.has(v)) {
        seen.add(v)
        out.push(v)
      }
    }
  }
  return out
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
  for (const t of ['product:price:amount', 'og:price:amount', 'twitter:data1']) {
    const n = parsePriceString(metaTag(html, t))
    if (n != null) return n
  }
  return null
}

function extractJsonLdPrice(html) {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    try {
      const v = findPriceDeep(JSON.parse(m[1].trim()))
      if (v != null) return v
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
    if (/^price$/i.test(k)) {
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
  return m ? parsePriceString(m[1]) : null
}

function parsePriceString(v) {
  if (v == null) return null
  const n = Number(String(v).replace(/[$,]/g, '').trim())
  return Number.isFinite(n) && n > 0 ? n : null
}
