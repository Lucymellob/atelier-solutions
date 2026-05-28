import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useProject, createRoom, updateProject } from '../hooks/useDb'
import RoomSection from '../components/RoomSection'
import SummaryBar from '../components/SummaryBar'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Field from '../components/Field'
import { exportProjectCSV } from '../lib/export'
import { formatCurrency } from '../lib/pricing'

export default function ProjectView() {
  const { id } = useParams()
  const { project, rooms, items, loading } = useProject(id)
  const [roomOpen, setRoomOpen] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [editingProject, setEditingProject] = useState(false)
  const [projName, setProjName] = useState('')
  const [projBudget, setProjBudget] = useState('')

  async function handleAddRoom(e) {
    e.preventDefault()
    if (!roomName.trim()) return
    await createRoom({ project_id: id, name: roomName.trim() })
    setRoomName('')
    setRoomOpen(false)
  }

  function openEdit() {
    setProjName(project?.name ?? '')
    setProjBudget(project?.budget ?? '')
    setEditingProject(true)
  }

  async function handleSaveProject(e) {
    e.preventDefault()
    await updateProject(id, {
      name: projName.trim(),
      budget: projBudget === '' ? null : Number(projBudget),
    })
    setEditingProject(false)
  }

  function handleExport() {
    const flat = items.map((i) => ({
      ...i,
      room_name: rooms.find((r) => r.id === i.room_id)?.name ?? '',
    }))
    exportProjectCSV(project, flat)
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl px-8 py-24">
        <p className="text-muted-foreground">Loading…</p>
      </section>
    )
  }

  if (!project) {
    return (
      <section className="mx-auto max-w-5xl px-8 py-24">
        <p className="text-muted-foreground">Project not found.</p>
        <Link to="/" className="mt-4 inline-block text-foreground underline">
          Back to projects
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-5xl px-8 py-10">
      <Link
        to="/"
        className="text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground"
      >
        ← Projects
      </Link>

      <header className="mt-6 flex flex-wrap items-end justify-between gap-6 pb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Project
          </p>
          <h1 className="mt-2 font-serif text-5xl tracking-tight text-foreground">
            {project.name}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}
            <span className="mx-2 text-muted-foreground/40">·</span>
            {items.length} {items.length === 1 ? 'item' : 'items'}
            {project.budget != null && (
              <>
                <span className="mx-2 text-muted-foreground/40">·</span>
                {formatCurrency(project.budget)} budget
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={openEdit}>
            Edit project
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            disabled={items.length === 0}
          >
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setRoomOpen(true)}>
            + Room
          </Button>
        </div>
      </header>

      <SummaryBar items={items} />

      <div className="mt-14 space-y-16">
        {rooms.length === 0 ? (
          <button
            onClick={() => setRoomOpen(true)}
            className="block w-full rounded-2xl border border-dashed border-border bg-card/40 py-20 text-center hover:border-foreground/30"
          >
            <p className="font-serif text-3xl tracking-tight text-foreground">
              Add the first room
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Primary Bedroom, Guest Lounge, Powder Room…
            </p>
          </button>
        ) : (
          rooms.map((room) => (
            <RoomSection
              key={room.id}
              room={room}
              items={items.filter((i) => i.room_id === room.id)}
            />
          ))
        )}
      </div>

      <Modal
        open={roomOpen}
        onClose={() => setRoomOpen(false)}
        title="New room"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRoomOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRoom}>Add room</Button>
          </>
        }
      >
        <form onSubmit={handleAddRoom}>
          <Field
            label="Room name"
            value={roomName}
            onChange={setRoomName}
            placeholder="Primary Bedroom"
            required
          />
        </form>
      </Modal>

      <Modal
        open={editingProject}
        onClose={() => setEditingProject(false)}
        title="Edit project"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditingProject(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProject}>Save</Button>
          </>
        }
      >
        <form onSubmit={handleSaveProject} className="space-y-5">
          <Field label="Project name" value={projName} onChange={setProjName} required />
          <Field
            label="Budget"
            type="number"
            step="0.01"
            value={projBudget}
            onChange={setProjBudget}
          />
        </form>
      </Modal>
    </section>
  )
}
