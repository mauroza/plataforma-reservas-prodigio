'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Plus, Trash2, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DiaEspecial {
  id:     string
  nombre: string
  fecha:  string  // YYYY-MM-DD
  tipo:   string
  notas?: string
}

interface Props { initialDias: DiaEspecial[] }

const TIPO_LABEL: Record<string, string> = {
  solo_manual:     'Solo manual (WhatsApp/llamada)',
  bloqueado_total: 'Bloqueado total (n8n rechaza automático)',
}

const TIPO_COLOR: Record<string, string> = {
  solo_manual:     'bg-amber-400/10 text-amber-400 border-amber-400/20',
  bloqueado_total: 'bg-[#cf5f56]/10 text-[#cf5f56] border-[#cf5f56]/20',
}

export function DiasEspecialesManager({ initialDias }: Props) {
  const [dias,      setDias]      = useState<DiaEspecial[]>(initialDias)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState({ nombre: '', fecha: '', tipo: 'solo_manual', notas: '' })
  const [error,     setError]     = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.nombre.trim() || !form.fecha) {
      setError('Nombre y fecha son requeridos.')
      return
    }

    const res = await fetch('/api/dias-especiales', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: form.nombre, fecha: form.fecha, tipo: form.tipo, notas: form.notas || undefined }),
    })

    if (!res.ok) {
      setError('Error al guardar. Intenta de nuevo.')
      return
    }

    const { dia } = await res.json()
    setDias(prev => [...prev, { ...dia, fecha: dia.fecha.split('T')[0] }].sort((a, b) => a.fecha.localeCompare(b.fecha)))
    setForm({ nombre: '', fecha: '', tipo: 'solo_manual', notas: '' })
    setShowForm(false)
    startTransition(() => router.refresh())
  }

  async function handleDelete(id: string) {
    await fetch(`/api/dias-especiales/${id}`, { method: 'DELETE' })
    setDias(prev => prev.filter(d => d.id !== id))
    startTransition(() => router.refresh())
  }

  const hoy = new Date().toISOString().split('T')[0]

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#ccc79f]" />
          <h2 className="text-sm font-semibold text-[#f2efe8]">Días Especiales</h2>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 text-xs text-[#ccc79f]/70 hover:text-[#ccc79f] transition-colors"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancelar' : 'Agregar'}
        </button>
      </div>

      <p className="text-xs text-[#f2efe8]/45 mb-4">
        En días especiales se reciben reservas <strong className="text-[#ccc79f]/80">solo por WhatsApp o llamada</strong>.
        Los días con tipo <span className="text-[#cf5f56]/80">Bloqueado total</span> el agente IA rechaza automáticamente.
      </p>

      {/* Formulario nuevo día */}
      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 rounded-xl border p-4 space-y-3 animate-fade-in"
              style={{ borderColor: 'rgba(204,199,159,0.12)', background: 'rgba(0,0,0,0.15)' }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/40">Nombre</label>
              <input
                required value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                className="input-base text-sm"
                placeholder="Día de la Madre…"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/40">Fecha</label>
              <input
                required type="date" min={hoy}
                value={form.fecha}
                onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
                className="input-base text-sm"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/40">Tipo</label>
              <div className="flex gap-2">
                {Object.entries(TIPO_LABEL).map(([val, lbl]) => (
                  <button
                    key={val} type="button"
                    onClick={() => setForm(p => ({ ...p, tipo: val }))}
                    className={cn(
                      'flex-1 text-xs px-3 py-2 rounded-lg border transition-all',
                      form.tipo === val ? TIPO_COLOR[val] : 'text-[#f2efe8]/40 border-[rgba(255,255,255,0.08)] hover:text-[#f2efe8]/60',
                    )}
                  >
                    {val === 'solo_manual' ? 'Solo manual' : 'Bloqueado total'}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/40">Notas (opcional)</label>
              <input
                value={form.notas}
                onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
                className="input-base text-sm"
                placeholder="Detalles adicionales…"
              />
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-[#cf5f56]/10 border border-[#cf5f56]/25 px-3 py-2 text-xs text-[#cf5f56]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1 text-sm">Cancelar</button>
            <button type="submit" disabled={isPending} className="btn-gold flex-1 text-sm">Guardar</button>
          </div>
        </form>
      )}

      {/* Lista */}
      {dias.length === 0 ? (
        <p className="text-xs text-[#f2efe8]/25 italic">No hay días especiales registrados.</p>
      ) : (
        <div className="space-y-2">
          {dias.map(d => {
            const pasado = d.fecha < hoy
            return (
              <div
                key={d.id}
                className={cn(
                  'flex items-center justify-between rounded-xl border px-4 py-3',
                  pasado ? 'opacity-40' : '',
                )}
                style={{ borderColor: 'rgba(204,199,159,0.08)', background: 'rgba(0,0,0,0.12)' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 text-center">
                    <p className="text-xs font-bold text-[#ccc79f]">
                      {new Date(d.fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                    </p>
                    <p className="text-[10px] text-[#f2efe8]/30">
                      {new Date(d.fecha + 'T12:00:00').getFullYear()}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-[#f2efe8]/80 font-medium truncate">{d.nombre}</p>
                    {d.notas && <p className="text-[10px] text-[#f2efe8]/35 truncate">{d.notas}</p>}
                  </div>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full border shrink-0', TIPO_COLOR[d.tipo])}>
                    {d.tipo === 'solo_manual' ? 'Manual' : 'Bloqueado'}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="shrink-0 ml-3 text-[#f2efe8]/20 hover:text-[#cf5f56]/70 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
