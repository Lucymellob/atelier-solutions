const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  nbsp: ' ', ndash: '–', mdash: '—', hellip: '…',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  laquo: '«', raquo: '»', copy: '©', reg: '®', trade: '™',
  times: '×', divide: '÷', deg: '°', cent: '¢', pound: '£', euro: '€',
  bull: '•', middot: '·', frac12: '½', frac14: '¼', frac34: '¾',
}

export function decodeEntities(s) {
  if (s == null) return s
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => safeFromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => safeFromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m)
}

function safeFromCodePoint(n) {
  try {
    return String.fromCodePoint(n)
  } catch {
    return ''
  }
}
