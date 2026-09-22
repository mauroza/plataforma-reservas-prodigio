'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UtensilsCrossed, Trash2 } from 'lucide-react'

interface Pasaboca {
  id: string
  nombre: string
  descripcion?: string | null
  precio: number
}

interface Props { initialPasabocas: Pasaboca[] }

const fmt = new Intl.NumberFormat('es-CO')

export function PasabocasManager({ initialPasabocas }: Props) {
  const [pasabocas, setPasabocas] = useState(initialPasabocas)
  const [form, setForm]           = useState({ nombre: '', descripcion: '', precio: '' })
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.nombre.trim()) {
      setError('El nombre es requerido.')
      return
    }
    const precio = Number(form.precio)
    if (!precio || precio <= 0) {
      setError('El precio es requerido.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/pasabocas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: form.nombre, descripcion: form.descripcion || undefined, precio }),
      })
      if (!res.ok) {
        setError('Error al guardar. Intenta de nuevo.')
        return
      }
      const { pasaboca } = await res.json()
      setPasabocas(prev => [...prev, pasaboca])
      setForm({ nombre: '', descripcion: '', precio: '' })
      startTransition(() => router.refresh())
    } finally {
      setSaving(false)
    }
  }

  async function quitar(id: string) {
    setSaving(true)
    try {
      await fetch(`/api/pasabocas/${id}`, { method: 'DELETE' })
      setPasabocas(prev => prev.filter(p => p.id !== id))
      startTransition(() => router.refresh())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-2">
        <UtensilsCrossed className="w-4 h-4 text-[#ccc79f]" />
        <h2 className="text-sm font-semibold text-[#f2efe8]">Pasabocas para Eventos</h2>
      </div>
      <p className="text-xs text-[#f2efe8]/40 mb-5">
        Entradas y para compartir que Mariana ofrece cuando arma una cotización de evento.
      </p>

      {pasabocas.length > 0 && (
        <div className="mb-4 space-y-2">
          {pasabocas.map(p => (
            <div key={p.id} className="flex items-start justify-between gap-3 rounded-xl bg-[#ccc79f]/10 border border-[#ccc79f]/20 p-3">
              <div>
                <p className="text-sm font-medium text-[#ccc79f]">{p.nombre} — ${fmt.format(p.precio)}</p>
                {p.descripcion && <p className="text-xs text-[#f2efe8]/60 mt-0.5">{p.descripcion}</p>}
              </div>
              <button onClick={() => quitar(p.id)} disabled={saving} className="btn-ghost p-1.5 shrink-0 text-[#cf5f56]/60 hover:text-[#cf5f56]" title="Quitar">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={agregar} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Nombre</label>
          <input
            value={form.nombre}
            onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
            className="input-base" placeholder="Ej: Guacamole de Chicharrón"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Descripción</label>
          <input
            value={form.descripcion}
            onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
            className="input-base" placeholder="Ej: Tostones de chicharrón en chalaquita tropical..."
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Precio (COP)</label>
          <input
            type="number"
            value={form.precio}
            onChange={e => setForm(p => ({ ...p, precio: e.target.value }))}
            className="input-base" placeholder="Ej: 45000"
          />
        </div>
        {error && <p className="text-xs text-[#cf5f56]">{error}</p>}
        <button type="submit" className="btn-gold" disabled={saving}>
          {saving ? 'Guardando…' : 'Agregar pasabocas'}
        </button>
      </form>
    </div>
  )
}
