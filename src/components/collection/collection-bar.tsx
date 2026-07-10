'use client'

import { useRef, useState } from 'react'
import { FolderOpen, Save, X } from 'lucide-react'
import { useStore, useHydrated, type Collection } from '@/lib/store'

export function CollectionBar() {
  const inputRef = useRef<HTMLInputElement>(null)
  const mounted = useHydrated()
  const [error, setError] = useState<string | null>(null)

  const collectionName = useStore(s => s.collectionName)
  const loadCollection = useStore(s => s.loadCollection)
  const closeCollection = useStore(s => s.closeCollection)
  const exportCollection = useStore(s => s.exportCollection)

  const handleOpen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text) as Collection
      if (!Array.isArray(data.ingredients) || !Array.isArray(data.recipes)) {
        throw new Error('Formato inválido: falta "ingredients" o "recipes".')
      }
      const name = file.name.replace(/\.json$/i, '')
      loadCollection(data, (data.metadata?.name as string) || name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer el archivo.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleSave = () => {
    const data = exportCollection()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const base = (collectionName || 'all-cleans-collection').replace(/\s+/g, '-').toLowerCase()
    a.download = `${base}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClose = () => {
    if (confirm('¿Cerrar la colección? Se limpiará de este navegador (tu archivo guardado no se toca).')) {
      closeCollection()
    }
  }

  const isOpen = mounted && !!collectionName

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleOpen}
      />

      {isOpen ? (
        <>
          <span className="hidden sm:inline text-sm text-muted-foreground max-w-[12rem] truncate" title={collectionName!}>
            {collectionName}
          </span>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
          >
            <Save className="h-4 w-4" /> Guardar
          </button>
          <button
            onClick={handleClose}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" /> Cerrar
          </button>
        </>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
        >
          <FolderOpen className="h-4 w-4" /> Abrir
        </button>
      )}

      {error && (
        <span className="text-xs text-red-500 max-w-[16rem] truncate" title={error}>
          {error}
        </span>
      )}
    </div>
  )
}
