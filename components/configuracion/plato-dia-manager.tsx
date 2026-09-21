'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sun, Trash2 } from 'lucide-react'

interface PlatoDia {
  platoNombre: string
  descripcion?: string
}

interface Props { initial: PlatoDia | null }

export function PlatoDiaManager({ initial }: Props) {
  const [actual,    setActual]    = useState<PlatoDia | null>(initial)
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
      const res = await fetch('/api/configuracion/plato-dia', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platoNombre: form.platoNombre, descripcion: form.descripcion || undefined }),
      })
      if (!res.ok) {
        setError('Error al guardar. Intenta de nuevo.')
        return
      }
      const { platoDia } = await res.json()
      setActual(platoDia)
      startTransition(() => router.refresh())
    } finally {
      setSaving(false)
    }
  }

  async function quitar() {
    setSaving(true)
    try {
      await fetch('/api/configuracion/plato-dia', { method: 'DELETE' })
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
        <Sun className="w-4 h-4 text-[#ccc79f]" />
        <h2 className="text-sm font-semibold text-[#f2efe8]">Plato del Día</h2>
      </div>
      <p className="text-xs text-[#f2efe8]/40 mb-5">
        Plato recomendado según el stock disponible HOY. Distinto del plato de la semana — cambialo cada día que necesites.
      </p>

      {actual && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-xl bg-[#ccc79f]/10 border border-[#ccc79f]/20 p-4">
          <div>
            <p className="text-sm font-medium text-[#ccc79f]">{actual.platoNombre}</p>
            {actual.descripcion && <p className="text-xs text-[#f2efe8]/60 mt-1">{actual.descripcion}</p>}
          </div>
          <button onClick={quitar} disabled={saving} className="btn-ghost p-1.5 shrink-0 text-[#cf5f56]/60 hover:text-[#cf5f56]" title="Quitar plato del día">
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
            className="input-base" placeholder="Ej: Salmón del Eje"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Nota opcional (por qué recomendarlo hoy)</label>
          <input
            value={form.descripcion}
            onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
            className="input-base" placeholder="Ej: Tenemos stock fresco hoy"
          />
        </div>
        {error && <p className="text-xs text-[#cf5f56]">{error}</p>}
        <button type="submit" className="btn-gold" disabled={saving}>
          {saving ? 'Guardando…' : actual ? 'Actualizar plato del día' : 'Guardar plato del día'}
        </button>
      </form>
    </div>
  )
}
