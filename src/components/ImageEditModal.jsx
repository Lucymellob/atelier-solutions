import { useEffect, useRef, useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import Field from './Field'

export default function ImageEditModal({ open, currentUrl = '', onClose, onSave }) {
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState('')
  const [processing, setProcessing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (open) {
      setUrl(currentUrl || '')
      setPreview(currentUrl || '')
      setProcessing(false)
      setDragging(false)
    }
  }, [open, currentUrl])

  useEffect(() => {
    if (!open) return
    function onPaste(e) {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            processFile(file)
            return
          }
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [open])

  async function processFile(file) {
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

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file && file.type.startsWith('image/')) {
      processFile(file)
    }
  }

  function handleUrlChange(v) {
    setUrl(v)
    setPreview(v)
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
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragging
              ? 'border-clay bg-clay/5 text-foreground'
              : 'border-border bg-muted/40 text-muted-foreground hover:border-foreground/40 hover:text-foreground'
          }`}
        >
          <p className="font-serif text-xl tracking-tight text-foreground">
            Drop an image here
          </p>
          <p className="mt-1 text-sm">
            paste a screenshot (⌘V), or click to choose a file
          </p>
          {processing && (
            <p className="mt-3 text-xs italic text-muted-foreground">Processing…</p>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            or
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Field
          label="Image URL"
          type="url"
          value={url.startsWith('data:') ? '' : url}
          onChange={handleUrlChange}
          placeholder="https://"
        />

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
