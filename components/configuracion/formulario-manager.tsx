'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardList } from 'lucide-react'

interface Formulario {
  url: string
  descripcion?: string
}

interface Props { initial: Formulario | null }

export function FormularioManager({ initial }: Props) {
  const [actual,    setActual]    = useState<Formulario | null>(initial)
  const [form,      setForm]      = useState({ url: initial?.url ?? '', descripcion: initial?.descripcion ?? '' })
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.url.trim()) {
      setError('El link del formulario es requerido.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/configuracion/formulario', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: form.url, descripcion: form.descripcion || undefined }),
      })
      if (!res.ok) {
        setError('Error al guardar. Intenta de nuevo.')
        return
      }
      const { formulario } = await res.json()
      setActual(formulario)
      startTransition(() => router.refresh())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-2">
        <ClipboardList className="w-4 h-4 text-[#ccc79f]" />
        <h2 className="text-sm font-semibold text-[#f2efe8]">Formulario de Cierre</h2>
      </div>
      <p className="text-xs text-[#f2efe8]/40 mb-5">
        Link que Mariana comparte al confirmar una reserva. Actualizalo cuando cambie el formulario.
      </p>

      {actual && (
        <div className="mb-4 rounded-xl bg-[#ccc79f]/10 border border-[#ccc79f]/20 p-4">
          <p className="text-sm font-medium text-[#ccc79f] break-all">{actual.url}</p>
          {actual.descripcion && <p className="text-xs text-[#f2efe8]/60 mt-1">{actual.descripcion}</p>}
        </div>
      )}

      <form onSubmit={save} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Link del formulario</label>
          <input
            value={form.url}
            onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
            className="input-base" placeholder="https://docs.google.com/forms/..."
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Nota opcional</label>
          <input
            value={form.descripcion}
            onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
            className="input-base" placeholder="Ej: Encuesta de satisfacción"
          />
        </div>
        {error && <p className="text-xs text-[#cf5f56]">{error}</p>}
        <button type="submit" className="btn-gold" disabled={saving}>
          {saving ? 'Guardando…' : 'Actualizar link'}
        </button>
      </form>
    </div>
  )
}
