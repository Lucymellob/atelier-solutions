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

  const priceSources = []
  const price =
    tryPrice(priceSources, 'json-ld', extractJsonLdPrice(html)) ??
    tryPrice(priceSources, 'og:price:amount', metaPrice(html)) ??
    tryPrice(priceSources, 'css', extractCssPrice(html)) ??
    tryPrice(priceSources, 'meta-description', extractPriceFromText(description)) ??
    tryPrice(priceSources, 'title', extractPriceFromText(title)) ??
    null

  const specs = extractSpecs(html, description)

  console.log('[scraper]', {
    url: sourceUrl,
    name: title.slice(0, 60),
    price,
    priceSources,
    imageCount: images.length,
    chosenImage: bestImage ? bestImage.slice(0, 80) : null,
    specs: specs ? specs.slice(0, 80) : null,
  })

  return {
    name: cleanTitle(title),
    vendor: siteName || hostnamePretty(sourceUrl),
    image_url: bestImage || '',
    image_candidates: images.slice(0, 10),
    product_url: absoluteUrl(ogUrl, sourceUrl) || sourceUrl,
    retail_price: price,
    specs,
  }
}

function tryPrice(log, source, value) {
  if (value != null) {
    log.push({ source, value })
    return value
  }
  return null
}

function collectImages(html, sourceUrl) {
  const out = []
  const seen = new Set()

  function add(url) {
    if (!url) return
    const abs = absoluteUrl(url, sourceUrl)
    if (!abs) return
    if (seen.has(abs)) return
    if (abs.startsWith('data:')) return
    if (/\b(logo|icon|spinner|placeholder|blank|sprite|favicon)\b/i.test(abs)) return
    seen.add(abs)
    out.push(abs)
  }

  for (const n of ['og:image', 'og:image:secure_url', 'twitter:image', 'twitter:image:src']) {
    metaTagAll(html, n).forEach(add)
  }

  collectJsonLdImages(html).forEach(add)
  collectImgTagSrcs(html).forEach(add)

  return out
}

function collectJsonLdImages(html) {
  const out = []
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    try {
      walkImages(JSON.parse(m[1].trim()), out)
    } catch {
      // ignore malformed json-ld
    }
  }
  return out
}

function walkImages(obj, out) {
  if (!obj || typeof obj !== 'object') return
  if (Array.isArray(obj)) {
    obj.forEach((v) => walkImages(v, out))
    return
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'image') {
      if (typeof v === 'string') out.push(v)
      else if (Array.isArray(v)) {
        v.forEach((img) => {
          if (typeof img === 'string') out.push(img)
          else if (img?.url) out.push(img.url)
        })
      } else if (v?.url) out.push(v.url)
    } else if (typeof v === 'object') {
      walkImages(v, out)
    }
  }
}

function collectImgTagSrcs(html) {
  const out = []
  const re = /<img\b[^>]*\b(?:src|data-src|data-zoom-image)\s*=\s*["']([^"']+)["'][^>]*>/gi
  let m
  let cap = 0
  while ((m = re.exec(html)) !== null && cap < 40) {
    out.push(m[1])
    cap++
  }
  return out
}

function pickBestImage(images) {
  if (!images.length) return ''
  const scored = images.map((url, i) => {
    let score = 0
    if (/white|clean|studio|flat/i.test(url)) score += 10
    if (/[-_]1\.(jpe?g|png|webp)/i.test(url)) score += 8
    return { url, score, order: i }
  })
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

function metaPrice(html) {
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
    if (/^(price|highPrice|lowPrice)$/i.test(k)) {
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

function extractCssPrice(html) {
  const patterns = [
    /<[^>]+\bdata-price\s*=\s*["']\$?\s*([0-9][\d,]*(?:\.\d{2})?)["']/i,
    /<[^>]+\bitemprop\s*=\s*["']price["'][^>]*\bcontent\s*=\s*["']\$?\s*([0-9][\d,]*(?:\.\d{2})?)["']/i,
    /<[^>]+\bcontent\s*=\s*["']\$?\s*([0-9][\d,]*(?:\.\d{2})?)["'][^>]*\bitemprop\s*=\s*["']price["']/i,
    /<[^>]+\bitemprop\s*=\s*["']price["'][^>]*>\s*\$?\s*([0-9][\d,]*(?:\.\d{2})?)/i,
    /<[^>]+\bclass\s*=\s*["'][^"']*\bregular-price\b[^"']*["'][^>]*>\s*\$?\s*([0-9][\d,]*(?:\.\d{2})?)/i,
    /<[^>]+\bclass\s*=\s*["'][^"']*\bproduct-price\b[^"']*["'][^>]*>\s*\$?\s*([0-9][\d,]*(?:\.\d{2})?)/i,
    /<[^>]+\bclass\s*=\s*["'][^"']*(?:^|\s)price(?:\s|$)[^"']*["'][^>]*>\s*\$?\s*([0-9][\d,]*(?:\.\d{2})?)/i,
  ]
  for (const re of patterns) {
    const m = html.match(re)
    const n = parsePriceString(m?.[1])
    if (n != null && n > 0) return n
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
  const n = Number(String(v).replace(/[$,\s]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

function extractSpecs(html, fallbackDescription) {
  // Prefer JSON-LD product description (often more structured)
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    try {
      const d = findStringDeep(JSON.parse(m[1].trim()), 'description')
      if (d) return trimSpec(d)
    } catch {
      // skip malformed json-ld
    }
  }
  if (fallbackDescription) return trimSpec(fallbackDescription)
  return ''
}

function findStringDeep(obj, key) {
  if (!obj || typeof obj !== 'object') return null
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const v = findStringDeep(item, key)
      if (v) return v
    }
    return null
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k === key && typeof v === 'string' && v.trim()) return v
    if (typeof v === 'object') {
      const r = findStringDeep(v, key)
      if (r) return r
    }
  }
  return null
}

function trimSpec(text) {
  const cleaned = String(text)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (cleaned.length <= 240) return cleaned
  const cut = cleaned.slice(0, 240)
  const lastDot = cut.lastIndexOf('. ')
  return (lastDot > 100 ? cut.slice(0, lastDot + 1) : cut) + '…'
}
