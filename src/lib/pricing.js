function num(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function qty(item) {
  return Number(item.quantity) || 1
}

export function unitRetail(item) {
  return num(item.retail_price)
}

export function unitSale(item) {
  return num(item.sale_price)
}

export function unitFinal(item) {
  return num(item.final_price)
}

export function unitTotal(item) {
  return num(item.final_price) ?? num(item.sale_price) ?? 0
}

export function lineRetail(item) {
  return (unitRetail(item) ?? 0) * qty(item)
}

export function lineSale(item) {
  return (unitSale(item) ?? unitRetail(item) ?? 0) * qty(item)
}

export function lineConfirmed(item) {
  const f = unitFinal(item)
  return f == null ? 0 : f * qty(item)
}

export function lineTotal(item) {
  return unitTotal(item) * qty(item)
}

function includes(item) {
  return item.include_in_budget !== false
}

export function totals(items) {
  const budgeted = items.filter(includes)
  return {
    retail: budgeted.reduce((s, i) => s + lineRetail(i), 0),
    sale: budgeted.reduce((s, i) => s + lineSale(i), 0),
    confirmed: budgeted.reduce((s, i) => s + lineConfirmed(i), 0),
    total: budgeted.reduce((s, i) => s + lineTotal(i), 0),
  }
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

export function formatCurrencyDetail(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value || 0)
}

export const grandTotal = (items) => totals(items).total
export const effectiveUnitPrice = unitTotal
