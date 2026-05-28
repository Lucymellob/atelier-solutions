import { unitTotal, lineTotal, totals, shippingOf } from './pricing'

export function exportProjectCSV(project, items) {
  const headers = [
    'Room',
    'Item',
    'Vendor',
    'Specs',
    'Quantity',
    'Retail',
    'Sale',
    'Final',
    'Shipping',
    'Unit (effective)',
    'Line total',
    'Product URL',
  ]
  const rows = items.map((i) => [
    i.room_name ?? '',
    i.name ?? '',
    i.vendor ?? '',
    i.specs ?? '',
    i.quantity ?? 1,
    fmtNum(i.retail_price),
    fmtNum(i.sale_price),
    fmtNum(i.final_price),
    fmtNum(shippingOf(i)),
    fmtNum(unitTotal(i)),
    fmtNum(lineTotal(i)),
    i.product_url ?? '',
  ])
  const t = totals(items)
  rows.push([])
  rows.push(['', '', '', '', '', '', '', '', 'Shipping', fmtNum(t.shipping), '', ''])
  rows.push(['', '', '', '', '', '', '', '', 'Grand total', fmtNum(t.total), '', ''])

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCell).join(','))
    .join('\n')

  download(`${slug(project?.name)}.csv`, csv, 'text/csv;charset=utf-8;')
}

function fmtNum(v) {
  if (v == null || v === '') return ''
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(2) : ''
}

function escapeCell(value) {
  const s = String(value ?? '')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function slug(name) {
  return String(name || 'project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
