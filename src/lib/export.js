import { effectiveUnitPrice, lineTotal, grandTotal } from './pricing'

export function exportProjectCSV(project, items) {
  const headers = [
    'Room',
    'Item',
    'Vendor',
    'Quantity',
    'Retail',
    'Sale',
    'Final',
    'Unit (effective)',
    'Line total',
    'Product URL',
  ]
  const rows = items.map((i) => [
    i.room_name ?? '',
    i.name ?? '',
    i.vendor ?? '',
    i.quantity ?? 1,
    fmtNum(i.retail_price),
    fmtNum(i.sale_price),
    fmtNum(i.final_price),
    fmtNum(effectiveUnitPrice(i)),
    fmtNum(lineTotal(i)),
    i.product_url ?? '',
  ])
  rows.push([])
  rows.push(['', '', '', '', '', '', '', 'Grand total', fmtNum(grandTotal(items)), ''])

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
