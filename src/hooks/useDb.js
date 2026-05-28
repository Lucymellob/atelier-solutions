import { useEffect, useState, useCallback } from 'react'
import { supabase, subscribe, notifyChange } from '../lib/supabase'

function useTable(table, query) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    let q = supabase.from(table).select('*')
    if (query?.eq) q = q.eq(query.eq[0], query.eq[1])
    if (query?.order) q = q.order(query.order[0], { ascending: query.order[1] !== false })
    const { data, error } = await q
    if (error) console.error(`[${table}]`, error.message)
    setRows(data || [])
    setLoading(false)
  }, [table, JSON.stringify(query)])

  useEffect(() => {
    load()
    return subscribe(load)
  }, [load])

  return { rows, loading, reload: load }
}

export function useProjects() {
  const { rows, loading } = useTable('projects', { order: ['created_at', false] })
  return { projects: rows, loading }
}

export function useProject(id) {
  const [project, setProject] = useState(null)
  const [rooms, setRooms] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!id) return
    const { data: p } = await supabase.from('projects').select('*').eq('id', id)
    const { data: r } = await supabase
      .from('rooms')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true })
    const roomIds = (r || []).map((row) => row.id)
    let i = []
    if (roomIds.length) {
      const { data } = await supabase
        .from('items')
        .select('*')
        .in('room_id', roomIds)
        .order('created_at', { ascending: true })
      i = data || []
    }
    setProject((p || [])[0] ?? null)
    setRooms(r || [])
    setItems(i)
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
    return subscribe(load)
  }, [load])

  return { project, rooms, items, loading, reload: load }
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

export async function createProject({ name, budget = null }) {
  return mutate(supabase.from('projects').insert({ name, budget }), 'createProject')
}

export async function updateProject(id, patch) {
  return mutate(supabase.from('projects').update(patch).eq('id', id), 'updateProject')
}

export async function deleteProject(id) {
  return mutate(supabase.from('projects').delete().eq('id', id), 'deleteProject')
}

export async function createRoom({ project_id, name }) {
  return mutate(supabase.from('rooms').insert({ project_id, name }), 'createRoom')
}

export async function updateRoom(id, patch) {
  return mutate(supabase.from('rooms').update(patch).eq('id', id), 'updateRoom')
}

export async function deleteRoom(id) {
  return mutate(supabase.from('rooms').delete().eq('id', id), 'deleteRoom')
}

export async function createItem(item) {
  const payload = {
    include_in_budget: true,
    quantity: 1,
    ...item,
  }
  return mutate(supabase.from('items').insert(payload), 'createItem')
}

export async function updateItem(id, patch) {
  return mutate(supabase.from('items').update(patch).eq('id', id), 'updateItem')
}

export async function duplicateItem(item) {
  const { id, created_at, ...rest } = item
  return mutate(supabase.from('items').insert(rest), 'duplicateItem')
}

export async function deleteItem(id) {
  return mutate(supabase.from('items').delete().eq('id', id), 'deleteItem')
}
