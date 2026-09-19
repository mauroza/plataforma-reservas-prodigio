'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Trash2 } from 'lucide-react'

interface PlatoSemana {
  platoNombre: string
  descripcion?: string
}

interface Props { initial: PlatoSemana | null }

export function PlatoSemanaManager({ initial }: Props) {
  const [actual,    setActual]    = useState<PlatoSemana | null>(initial)
  const [form,      setForm]      = useState({ platoNombre: initial?.platoNombre ?? '', descripcion: initial?.descripcion ?? '' })
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.platoNombre.trim()) {
      setError('El nombre del plato es requerido.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/configuracion/plato-semana', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platoNombre: form.platoNombre, descripcion: form.descripcion || undefined }),
      })
      if (!res.ok) {
        setError('Error al guardar. Intenta de nuevo.')
        return
      }
      const { platoSemana } = await res.json()
      setActual(platoSemana)
      startTransition(() => router.refresh())
    } finally {
      setSaving(false)
    }
  }

  async function quitar() {
    setSaving(true)
    try {
      await fetch('/api/configuracion/plato-semana', { method: 'DELETE' })
      setActual(null)
      setForm({ platoNombre: '', descripcion: '' })
      startTransition(() => router.refresh())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-[#ccc79f]" />
        <h2 className="text-sm font-semibold text-[#f2efe8]">Plato / Recomendación de la Semana</h2>
      </div>
      <p className="text-xs text-[#f2efe8]/40 mb-5">
        Lo que pongas acá se lo recomienda Mariana a los clientes por WhatsApp esta semana. Cambialo cuando quieras.
      </p>

      {actual && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-xl bg-[#ccc79f]/10 border border-[#ccc79f]/20 p-4">
          <div>
            <p className="text-sm font-medium text-[#ccc79f]">{actual.platoNombre}</p>
            {actual.descripcion && <p className="text-xs text-[#f2efe8]/60 mt-1">{actual.descripcion}</p>}
          </div>
          <button onClick={quitar} disabled={saving} className="btn-ghost p-1.5 shrink-0 text-[#cf5f56]/60 hover:text-[#cf5f56]" title="Quitar recomendación">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={save} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Nombre del plato</label>
          <input
            value={form.platoNombre}
            onChange={e => setForm(p => ({ ...p, platoNombre: e.target.value }))}
            className="input-base" placeholder="Ej: Ceviche Prodigio"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Nota opcional (por qué recomendarlo)</label>
          <input
            value={form.descripcion}
            onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
            className="input-base" placeholder="Ej: Tenemos mucho stock esta semana"
          />
        </div>
        {error && <p className="text-xs text-[#cf5f56]">{error}</p>}
        <button type="submit" className="btn-gold" disabled={saving}>
          {saving ? 'Guardando…' : actual ? 'Actualizar recomendación' : 'Guardar recomendación'}
        </button>
      </form>
    </div>
  )
}
