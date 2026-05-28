import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useProjects,
  useProject,
  createProject,
  deleteProject,
} from '../hooks/useDb'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Field from '../components/Field'
import { formatCurrency, grandTotal } from '../lib/pricing'

export default function Dashboard() {
  const { projects, loading } = useProjects()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    await createProject({
      name: name.trim(),
      budget: budget === '' ? null : Number(budget),
    })
    setName('')
    setBudget('')
    setOpen(false)
  }

  async function handleDelete(project) {
    if (!confirm(`Delete "${project.name}" and all its rooms and items?`)) return
    await deleteProject(project.id)
  }

  return (
    <section className="mx-auto max-w-6xl px-8 py-16">
      <div className="flex items-end justify-between border-b border-border pb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Workspace
          </p>
          <h1 className="mt-3 font-serif text-6xl tracking-tight text-foreground">
            Your projects
          </h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            Source furniture, organize by room, and present clean budgets.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>+ New project</Button>
      </div>

      {loading ? (
        <p className="mt-16 text-muted-foreground">Loading…</p>
      ) : projects.length === 0 ? (
        <EmptyState onCreate={() => setOpen(true)} />
      ) : (
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onDelete={() => handleDelete(p)} />
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New project"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-5">
          <Field
            label="Project name"
            value={name}
            onChange={setName}
            placeholder="Labazzo 2nd Floor"
            required
          />
          <Field
            label="Budget (optional)"
            type="number"
            step="0.01"
            value={budget}
            onChange={setBudget}
            placeholder="50000"
          />
        </form>
      </Modal>
    </section>
  )
}

function ProjectCard({ project, onDelete }) {
  const { rooms, items } = useProject(project.id)
  const total = grandTotal(items)

  return (
    <li className="group relative">
      <Link
        to={`/projects/${project.id}`}
        className="block h-full rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground/25"
      >
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Project
        </p>
        <h2 className="mt-2 font-serif text-2xl leading-tight tracking-tight text-foreground">
          {project.name}
        </h2>

        <dl className="mt-6 grid grid-cols-3 gap-3 text-sm">
          <Stat label="Rooms" value={rooms.length} />
          <Stat label="Items" value={items.length} />
          <Stat label="Total" value={formatCurrency(total)} />
        </dl>

        {project.budget != null && (
          <p className="mt-4 text-xs text-muted-foreground">
            Budget: {formatCurrency(project.budget)}
          </p>
        )}
      </Link>
      <button
        onClick={onDelete}
        className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-red-600 group-hover:opacity-100"
        title="Delete project"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        </svg>
      </button>
    </li>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-foreground tabular-nums">{value}</dd>
    </div>
  )
}

function EmptyState({ onCreate }) {
  return (
    <div className="mt-16 rounded-2xl border border-dashed border-border bg-card/40 p-16 text-center">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
        A blank page
      </p>
      <h2 className="mt-4 font-serif text-3xl tracking-tight text-foreground">
        Begin your first project.
      </h2>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        Create a project for the home, then add rooms and source items by vendor,
        price, and product link.
      </p>
      <div className="mt-8 flex justify-center">
        <Button onClick={onCreate}>+ New project</Button>
      </div>
    </div>
  )
}
