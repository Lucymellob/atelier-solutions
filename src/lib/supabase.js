import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error(
    'Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local',
  )
}

export const supabase = createClient(url, key)

const EVENT = 'atelier:db:change'

export function notifyChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT))
  }
}

export function subscribe(callback) {
  const handler = () => callback()
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
