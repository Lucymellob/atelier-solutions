import { useEffect, useRef, useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import Field from './Field'

export default function ImageEditModal({ open, currentUrl = '', onClose, onSave }) {
  const [mode, setMode] = useState('url')
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState('')
  const [processing, setProcessing] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (open) {
      setMode('url')
      setUrl(currentUrl || '')
      setPreview(currentUrl || '')
      setProcessing(false)
    }
  }, [open, currentUrl])

  function handleUrlChange(v) {
    setUrl(v)
    setPreview(v)
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setProcessing(true)
    try {
      const dataUrl = await resizeImage(file, 800, 0.85)
      setPreview(dataUrl)
      setUrl(dataUrl)
    } catch (err) {
      alert('Could not read that image: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  function handleSave() {
    onSave(url.trim() || null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit image"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={processing}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex gap-2 border-b border-border">
          <TabBtn active={mode === 'url'} onClick={() => setMode('url')}>
            Paste URL
          </TabBtn>
          <TabBtn active={mode === 'upload'} onClick={() => setMode('upload')}>
            Upload from computer
          </TabBtn>
        </div>

        {mode === 'url' ? (
          <Field
            label="Image URL"
            type="url"
            value={url.startsWith('data:') ? '' : url}
            onChange={handleUrlChange}
            placeholder="https://..."
          />
        ) : (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Pick an image
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="block w-full text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-foreground file:px-4 file:py-2 file:text-sm file:font-medium file:text-background hover:file:bg-foreground/85"
            />
            {processing && (
              <p className="text-xs text-muted-foreground">Processing image…</p>
            )}
            <p className="text-xs text-muted-foreground">
              Resized to 800px wide to keep the database fast.
            </p>
          </div>
        )}

        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Preview
          </p>
          <div className="mt-2 flex h-48 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
            {preview ? (
              <img
                src={preview}
                alt=""
                className="max-h-full max-w-full object-contain"
                onError={() => setPreview('')}
              />
            ) : (
              <span className="text-sm text-muted-foreground">No image yet</span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
        active
          ? 'border-foreground text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

function resizeImage(file, maxWidth, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('File read failed'))
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => reject(new Error('Image decode failed'))
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
