'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Leaf, Trash2 } from 'lucide-react'

interface VegetarianOption {
  id: string
  nombre: string
  notas?: string | null
}

interface Props { initialOpciones: VegetarianOption[] }

export function VegetarianosManager({ initialOpciones }: Props) {
  const [opciones, setOpciones] = useState(initialOpciones)
  const [form, setForm]         = useState({ nombre: '', notas: '' })
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.nombre.trim()) {
      setError('El nombre del plato es requerido.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/vegetarianos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: form.nombre, notas: form.notas || undefined }),
      })
      if (!res.ok) {
        setError('Error al guardar. Intenta de nuevo.')
        return
      }
      const { opcion } = await res.json()
      setOpciones(prev => [...prev, opcion])
      setForm({ nombre: '', notas: '' })
      startTransition(() => router.refresh())
    } finally {
      setSaving(false)
    }
  }

  async function quitar(id: string) {
    setSaving(true)
    try {
      await fetch(`/api/vegetarianos/${id}`, { method: 'DELETE' })
      setOpciones(prev => prev.filter(o => o.id !== id))
      startTransition(() => router.refresh())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-2">
        <Leaf className="w-4 h-4 text-[#ccc79f]" />
        <h2 className="text-sm font-semibold text-[#f2efe8]">Opciones Vegetarianas</h2>
      </div>
      <p className="text-xs text-[#f2efe8]/40 mb-5">
        Platos del menú que Mariana puede recomendar cuando un cliente pide opciones vegetarianas.
      </p>

      {opciones.length > 0 && (
        <div className="mb-4 space-y-2">
          {opciones.map(o => (
            <div key={o.id} className="flex items-start justify-between gap-3 rounded-xl bg-[#ccc79f]/10 border border-[#ccc79f]/20 p-3">
              <div>
                <p className="text-sm font-medium text-[#ccc79f]">{o.nombre}</p>
                {o.notas && <p className="text-xs text-[#f2efe8]/60 mt-0.5">{o.notas}</p>}
              </div>
              <button onClick={() => quitar(o.id)} disabled={saving} className="btn-ghost p-1.5 shrink-0 text-[#cf5f56]/60 hover:text-[#cf5f56]" title="Quitar">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={agregar} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Nombre del plato</label>
          <input
            value={form.nombre}
            onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
            className="input-base" placeholder="Ej: Burrata Prodigio"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Nota opcional</label>
          <input
            value={form.notas}
            onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
            className="input-base" placeholder="Ej: Sin carne ni pescado"
          />
        </div>
        {error && <p className="text-xs text-[#cf5f56]">{error}</p>}
        <button type="submit" className="btn-gold" disabled={saving}>
          {saving ? 'Guardando…' : 'Agregar opción'}
        </button>
      </form>
    </div>
  )
}
