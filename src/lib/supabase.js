const STORAGE_KEY = 'atelier:db:v1'

function read() {
  if (typeof window === 'undefined') return { projects: [], rooms: [], items: [] }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { projects: [], rooms: [], items: [] }
    return JSON.parse(raw)
  } catch {
    return { projects: [], rooms: [], items: [] }
  }
}

function write(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent('atelier:db:change'))
}

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function applyFilters(rows, filters) {
  return rows.filter((row) =>
    filters.every(([col, op, val]) => {
      if (op === 'eq') return row[col] === val
      if (op === 'in') return val.includes(row[col])
      return true
    }),
  )
}

function applyOrder(rows, order) {
  if (!order) return rows
  const { col, ascending } = order
  const sorted = [...rows].sort((a, b) => {
    const av = a[col]
    const bv = b[col]
    if (av === bv) return 0
    return av > bv ? 1 : -1
  })
  return ascending ? sorted : sorted.reverse()
}

class QueryBuilder {
  constructor(table, mode = 'select', payload = null) {
    this.table = table
    this.mode = mode
    this.payload = payload
    this.filters = []
    this._order = null
    this._single = false
  }

  eq(col, val) {
    this.filters.push([col, 'eq', val])
    return this
  }

  in(col, val) {
    this.filters.push([col, 'in', val])
    return this
  }

  order(col, opts = {}) {
    this._order = { col, ascending: opts.ascending !== false }
    return this
  }

  single() {
    this._single = true
    return this
  }

  select() {
    return this
  }

  then(resolve, reject) {
    try {
      const state = read()
      const rows = state[this.table] || []
      let result

      if (this.mode === 'select') {
        let data = applyFilters(rows, this.filters)
        data = applyOrder(data, this._order)
        result = { data: this._single ? data[0] ?? null : data, error: null }
      } else if (this.mode === 'insert') {
        const incoming = Array.isArray(this.payload) ? this.payload : [this.payload]
        const inserted = incoming.map((row) => ({
          id: row.id ?? uuid(),
          created_at: row.created_at ?? new Date().toISOString(),
          ...row,
        }))
        state[this.table] = [...rows, ...inserted]
        write(state)
        result = {
          data: Array.isArray(this.payload) ? inserted : inserted[0],
          error: null,
        }
      } else if (this.mode === 'update') {
        const next = rows.map((row) => {
          const matches = this.filters.every(([col, op, val]) =>
            op === 'eq' ? row[col] === val : true,
          )
          return matches ? { ...row, ...this.payload } : row
        })
        state[this.table] = next
        write(state)
        result = { data: applyFilters(next, this.filters), error: null }
      } else if (this.mode === 'delete') {
        const keep = rows.filter(
          (row) =>
            !this.filters.every(([col, op, val]) =>
              op === 'eq' ? row[col] === val : op === 'in' ? val.includes(row[col]) : false,
            ),
        )
        const removed = rows.filter((row) => !keep.includes(row))
        if (this.table === 'projects') {
          const removedIds = removed.map((r) => r.id)
          const roomsToRemove = state.rooms.filter((r) => removedIds.includes(r.project_id))
          const roomIds = roomsToRemove.map((r) => r.id)
          state.rooms = state.rooms.filter((r) => !removedIds.includes(r.project_id))
          state.items = state.items.filter((i) => !roomIds.includes(i.room_id))
        } else if (this.table === 'rooms') {
          const removedIds = removed.map((r) => r.id)
          state.items = state.items.filter((i) => !removedIds.includes(i.room_id))
        }
        state[this.table] = keep
        write(state)
        result = { data: removed, error: null }
      }

      resolve(result)
    } catch (error) {
      if (reject) reject(error)
      else resolve({ data: null, error })
    }
  }
}

function from(table) {
  return {
    select: () => new QueryBuilder(table, 'select'),
    insert: (payload) => new QueryBuilder(table, 'insert', payload),
    update: (payload) => new QueryBuilder(table, 'update', payload),
    delete: () => new QueryBuilder(table, 'delete'),
  }
}

export const supabase = { from }

export function subscribe(callback) {
  const handler = () => callback()
  window.addEventListener('atelier:db:change', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('atelier:db:change', handler)
    window.removeEventListener('storage', handler)
  }
}
