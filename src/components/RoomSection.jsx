import { useState } from 'react'
import ItemCard from './ItemCard'
import ItemForm from './ItemForm'
import PasteLinkCard from './PasteLinkCard'
import Modal from './Modal'
import Field from './Field'
import Button from './Button'
import { Pencil, Trash } from './Icons'
import {
  createItem,
  updateItem,
  duplicateItem,
  deleteItem,
  updateRoom,
  deleteRoom,
} from '../hooks/useDb'
import { totals, formatCurrency } from '../lib/pricing'

export default function RoomSection({ room, items = [] }) {
  const [mode, setMode] = useState('idle') // idle | manual | prefilled
  const [prefill, setPrefill] = useState(null)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(room.name)

  const roomTotal = totals(items).sale

  function handleFetched(meta) {
    setPrefill(meta)
    setMode('manual')
  }

  function handleManualWithUrl(url) {
    setPrefill({ product_url: url })
    setMode('manual')
  }

  async function handleManualSave(values) {
    await createItem({ ...values, room_id: room.id })
    setMode('idle')
    setPrefill(null)
  }

  async function handleDeleteItem(item) {
    if (!confirm(`Delete "${item.name}"?`)) return
    await deleteItem(item.id)
  }

  async function handleDuplicate(item) {
    await duplicateItem(item)
  }

  async function handleRoomDelete() {
    if (!confirm(`Delete room "${room.name}" and all its items?`)) return
    await deleteRoom(room.id)
  }

  async function handleRoomRename(e) {
    e.preventDefault()
    if (!newName.trim()) return
    await updateRoom(room.id, { name: newName.trim() })
    setRenaming(false)
  }

  return (
    <section className="space-y-5">
      <header className="flex items-end justify-between gap-6 border-b border-border pb-4">
        <div className="flex items-baseline gap-4">
          <h2 className="font-serif text-4xl tracking-tight text-foreground">
            {room.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'}
            <span className="mx-2 text-muted-foreground/40">·</span>
            <span className="tabular-nums">{formatCurrency(roomTotal)}</span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setPrefill(null)
              setMode('manual')
            }}
          >
            + Add item
          </Button>
          <button
            onClick={() => {
              setNewName(room.name)
              setRenaming(true)
            }}
            title="Rename room"
            className="ml-2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil />
          </button>
          <button
            onClick={handleRoomDelete}
            title="Delete room"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-red-600"
          >
            <Trash />
          </button>
        </div>
      </header>

      {mode === 'idle' && (
        <PasteLinkCard
          onFetched={handleFetched}
          onManualWithUrl={handleManualWithUrl}
          onManual={() => {
            setPrefill(null)
            setMode('manual')
          }}
        />
      )}

      {mode === 'manual' && (
        <ItemForm
          initial={prefill}
          onSave={handleManualSave}
          onCancel={() => {
            setMode('idle')
            setPrefill(null)
          }}
        />
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onUpdate={(patch) => updateItem(item.id, patch)}
            onDuplicate={() => handleDuplicate(item)}
            onDelete={() => handleDeleteItem(item)}
          />
        ))}
      </div>

      <Modal
        open={renaming}
        onClose={() => setRenaming(false)}
        title="Rename room"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenaming(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoomRename}>Save</Button>
          </>
        }
      >
        <form onSubmit={handleRoomRename}>
          <Field label="Room name" value={newName} onChange={setNewName} required />
        </form>
      </Modal>
    </section>
  )
}
