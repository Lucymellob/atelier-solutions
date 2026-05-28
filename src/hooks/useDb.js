import { useEffect, useState, useCallback } from 'react'
import { supabase, subscribe } from '../lib/supabase'

function useTable(table, query) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    let q = supabase.from(table).select()
    if (query?.eq) q = q.eq(query.eq[0], query.eq[1])
    if (query?.order) q = q.order(query.order[0], { ascending: query.order[1] !== false })
    const { data } = await q
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
    const { data: p } = await supabase.from('projects').select().eq('id', id)
    const { data: r } = await supabase
      .from('rooms')
      .select()
      .eq('project_id', id)
      .order('created_at', { ascending: true })
    const roomIds = (r || []).map((row) => row.id)
    let i = []
    if (roomIds.length) {
      const { data } = await supabase
        .from('items')
        .select()
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

export async function createProject({ name, budget = null }) {
  const { data } = await supabase.from('projects').insert({ name, budget })
  return data
}

export async function updateProject(id, patch) {
  await supabase.from('projects').update(patch).eq('id', id)
}

export async function deleteProject(id) {
  await supabase.from('projects').delete().eq('id', id)
}

export async function createRoom({ project_id, name }) {
  const { data } = await supabase.from('rooms').insert({ project_id, name })
  return data
}

export async function updateRoom(id, patch) {
  await supabase.from('rooms').update(patch).eq('id', id)
}

export async function deleteRoom(id) {
  await supabase.from('rooms').delete().eq('id', id)
}

export async function createItem(item) {
  const { data } = await supabase.from('items').insert({
    include_in_budget: true,
    quantity: 1,
    ...item,
  })
  return data
}

export async function updateItem(id, patch) {
  await supabase.from('items').update(patch).eq('id', id)
}

export async function duplicateItem(item) {
  const { id, created_at, ...rest } = item
  const { data } = await supabase.from('items').insert(rest)
  return data
}

export async function deleteItem(id) {
  await supabase.from('items').delete().eq('id', id)
}
