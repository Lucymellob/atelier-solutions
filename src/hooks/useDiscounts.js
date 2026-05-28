import { useEffect, useState, useCallback } from 'react'
import { supabase, subscribe, notifyChange } from '../lib/supabase'

export function useDiscounts() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('vendor_discounts')
      .select('*')
      .order('name', { ascending: true })
    if (error) console.error('[useDiscounts]', error.message)
    setRows(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    return subscribe(load)
  }, [load])

  return { discounts: rows, loading, reload: load }
}

async function mutate(promise, label) {
  const { error } = await promise
  if (error) {
    console.error(`[${label}]`, error.message)
    alert(`Save failed: ${error.message}`)
    return false
  }
  notifyChange()
  return true
}

export async function createDiscount({ domain, name, discount_pct }) {
  return mutate(
    supabase.from('vendor_discounts').insert({
      domain: String(domain).trim().toLowerCase(),
      name: String(name).trim(),
      discount_pct: Number(discount_pct),
    }),
    'createDiscount',
  )
}

export async function updateDiscount(id, patch) {
  const clean = { ...patch }
  if (clean.domain) clean.domain = String(clean.domain).trim().toLowerCase()
  if (clean.discount_pct != null) clean.discount_pct = Number(clean.discount_pct)
  return mutate(
    supabase.from('vendor_discounts').update(clean).eq('id', id),
    'updateDiscount',
  )
}

export async function deleteDiscount(id) {
  return mutate(supabase.from('vendor_discounts').delete().eq('id', id), 'deleteDiscount')
}
