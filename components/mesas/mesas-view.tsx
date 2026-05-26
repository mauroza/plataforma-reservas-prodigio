'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Unlock, Info, X, Calendar, Clock, AlertTriangle } from 'lucide-react'
import type { Mesa, Zone, TableStatus } from '@/types'
import { getTableStatusStyle, getTableStatusLabel, formatTime, cn } from '@/lib/utils'

interface Props { initialMesas: Mesa[] }

const ZONE_LABEL: Record<Zone, string> = {
  salon_interno: 'Salón Interno',
  terraza:       'Terraza',
}

const STATUS_DOT: Record<TableStatus, string> = {
  disponible: 'bg-emerald-400',
  ocupada:    'bg-red-400',
  reservada:  'bg-amber-400',
  bloqueada:  'bg-gray-500',
}

interface BloqueoForm {
  inicio: string
  fin: string
  motivo: string
}

export function MesasView({ initialMesas }: Props) {
  const [mesas,       setMesas]       = useState<Mesa[]>(initialMesas)
  const [zone,        setZone]        = useState<Zone | 'all'>('all')
  const [selected,    setSelected]    = useState<Mesa | null>(null)
  const [showBloqueo, setShowBloqueo] = useState(false)
  const [bloqueoForm, setBloqueoForm] = useState<BloqueoForm>({ inicio: '', fin: '', motivo: '' })
  const [error,       setError]       = useState('')
  const [isPending,   startTransition] = useTransition()
  const router = useRouter()

  const zones = ['salon_interno', 'terraza'] as const
  const displayZones = zone === 'all' ? zones : [zone] as Zone[]

  const counts = {
    disponible: mesas.filter(m => m.reservable && m.estado === 'disponible').length,
    ocupada:    mesas.filter(m => m.estado === 'ocupada').length,
    reservada:  mesas.filter(m => m.estado === 'reservada').length,
    bloqueada:  mesas.filter(m => m.estado === 'bloqueada').length,
  }

  async function handleBloquear(mesa: Mesa) {
    if (mesa.estado === 'bloqueada') {
      // Desbloquear: eliminar bloques activos de esta mesa
      await fetch(`/api/mesas/bloques?tableId=${mesa.id}`)
        .then(r => r.json())
        .then(async ({ bloques }) => {
          for (const b of bloques) {
            await fetch(`/api/mesas/bloques/${b.id}`, { method: 'DELETE' })
          }
        })
      setMesas(prev => prev.map(m => m.id === mesa.id ? { ...m, estado: 'disponible' } : m))
      setSelected(null)
      startTransition(() => router.refresh())
      return
    }
    setShowBloqueo(true)
  }

  async function submitBloqueo(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setError('')

    if (bloqueoForm.fin <= bloqueoForm.inicio) {
      setError('La hora de fin debe ser posterior a la de inicio.')
      return
    }

    const res = await fetch('/api/mesas/bloques', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: selected.id,
        inicio:  new Date(bloqueoForm.inicio).toISOString(),
        fin:     new Date(bloqueoForm.fin).toISOString(),
        motivo:  bloqueoForm.motivo || undefined,
      }),
    })

    if (!res.ok) {
      setError('Error al crear el bloqueo. Intenta de nuevo.')
      return
    }

    setMesas(prev => prev.map(m => m.id === selected.id ? { ...m, estado: 'bloqueada' } : m))
    setShowBloqueo(false)
    setSelected(null)
    setBloqueoForm({ inicio: '', fin: '', motivo: '' })
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Summary cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(counts) as [TableStatus, number][]).map(([st, n]) => (
          <div key={st} className="card p-4 flex items-center gap-3">
            <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', STATUS_DOT[st])} />
            <div>
              <p className="text-lg font-semibold text-[#f2efe8] leading-none">{n}</p>
              <p className="text-[10px] text-[#f2efe8]/40 mt-0.5 capitalize">{getTableStatusLabel(st)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Zone tabs ────────────────────────────────────────────────── */}
      <div className="flex gap-2 p-1 bg-[#19191c] rounded-xl w-fit border" style={{ borderColor: 'rgba(204,199,159,0.08)' }}>
        {['all', 'salon_interno', 'terraza'].map(z => (
          <button
            key={z}
            onClick={() => setZone(z as typeof zone)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              zone === z
                ? 'bg-[#ccc79f] text-[#0c0c0d]'
                : 'text-[#f2efe8]/50 hover:text-[#f2efe8]',
            )}
          >
            {z === 'all' ? 'Todas' : ZONE_LABEL[z as Zone]}
          </button>
        ))}
      </div>

      {/* ── Mesa grid by zone ────────────────────────────────────────── */}
      {displayZones.map(z => {
        const zoneMesas = mesas.filter(m => m.zona === z)
        const mTables   = zoneMesas.filter(m => m.tipo === 'M')
        const tTables   = zoneMesas.filter(m => m.tipo === 'T')

        return (
          <div key={z} className="space-y-4">
            <h2 className="text-sm font-semibold text-[#f2efe8] flex items-center gap-2">
              <span className="w-px h-4 bg-[#ccc79f]" />
              {ZONE_LABEL[z]}
            </h2>

            {mTables.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#f2efe8]/25 mb-3">Mesas regulares (M)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {mTables.map(mesa => (
                    <MesaCard key={mesa.id} mesa={mesa} onSelect={() => setSelected(mesa)} />
                  ))}
                </div>
              </div>
            )}

            {tTables.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#f2efe8]/25 mb-3">Mesas altas (T)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {tTables.map(mesa => (
                    <MesaCard key={mesa.id} mesa={mesa} onSelect={() => setSelected(mesa)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* ── Detail modal ─────────────────────────────────────────────── */}
      {selected && !showBloqueo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative z-10 w-full max-w-sm bg-[#19191c] rounded-2xl border shadow-2xl animate-slide-in"
               style={{ borderColor: 'rgba(204,199,159,0.12)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(204,199,159,0.1)' }}>
              <div className="flex items-center gap-3">
                <div className={cn('w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-sm',
                                   getTableStatusStyle(selected.estado))}>
                  {selected.nombre}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#f2efe8]">Mesa {selected.nombre}</p>
                  <p className="text-xs text-[#f2efe8]/40">{ZONE_LABEL[selected.zona]} · {selected.capacidad} personas</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className={cn('badge text-xs px-3 py-1', getTableStatusStyle(selected.estado))}>
                  {getTableStatusLabel(selected.estado)}
                </span>
                <span className="text-xs text-[#f2efe8]/40">{selected.tipo === 'T' ? 'Alta / Bar' : 'Regular'}</span>
              </div>

              {selected.reservaActual && (
                <div className="rounded-xl bg-[rgba(0,0,0,0.2)] border p-4" style={{ borderColor: 'rgba(204,199,159,0.08)' }}>
                  <p className="text-[10px] uppercase tracking-wider text-[#f2efe8]/30 mb-2">Reserva activa</p>
                  <p className="text-sm font-medium text-[#f2efe8]">{selected.reservaActual.nombreCliente}</p>
                  <p className="text-xs text-[#f2efe8]/50 mt-1">
                    {selected.reservaActual.personas} personas ·{' '}
                    {formatTime(selected.reservaActual.inicio)} – {formatTime(selected.reservaActual.fin)}
                  </p>
                </div>
              )}

              {!selected.reservable && (
                <div className="rounded-xl bg-[#522b38]/15 border border-[#522b38]/25 p-3 text-xs text-rose-300">
                  Esta mesa no está habilitada para reservas estándar.
                </div>
              )}

              <div className="flex gap-2 pt-1">
                {selected.estado !== 'ocupada' && (
                  <button
                    onClick={() => handleBloquear(selected)}
                    disabled={isPending}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium border transition-all',
                      selected.estado === 'bloqueada'
                        ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/25 hover:bg-emerald-400/20'
                        : 'bg-[#cf5f56]/10 text-[#cf5f56] border-[#cf5f56]/25 hover:bg-[#cf5f56]/20',
                    )}
                  >
                    {selected.estado === 'bloqueada'
                      ? <><Unlock className="w-4 h-4" /> Desbloquear</>
                      : <><Lock className="w-4 h-4" /> Bloquear mesa</>
                    }
                  </button>
                )}
                <button onClick={() => setSelected(null)} className="btn-outline flex-1">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bloqueo modal ────────────────────────────────────────────── */}
      {showBloqueo && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowBloqueo(false); setError('') }} />
          <div className="relative z-10 w-full max-w-sm bg-[#19191c] rounded-2xl border shadow-2xl animate-slide-in"
               style={{ borderColor: 'rgba(204,199,159,0.12)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(204,199,159,0.1)' }}>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#cf5f56]" />
                <h3 className="font-semibold text-[#f2efe8]">Bloquear Mesa {selected.nombre}</h3>
              </div>
              <button onClick={() => { setShowBloqueo(false); setError('') }} className="btn-ghost p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitBloqueo} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Inicio
                  </label>
                  <input
                    required type="datetime-local"
                    value={bloqueoForm.inicio}
                    onChange={e => setBloqueoForm(p => ({ ...p, inicio: e.target.value }))}
                    className="input-base text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Fin
                  </label>
                  <input
                    required type="datetime-local"
                    value={bloqueoForm.fin}
                    onChange={e => setBloqueoForm(p => ({ ...p, fin: e.target.value }))}
                    className="input-base text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Motivo (opcional)</label>
                <input
                  value={bloqueoForm.motivo}
                  onChange={e => setBloqueoForm(p => ({ ...p, motivo: e.target.value }))}
                  className="input-base"
                  placeholder="Limpieza profunda, reservada por teléfono…"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-[#cf5f56]/10 border border-[#cf5f56]/25 px-3 py-2 text-xs text-[#cf5f56]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowBloqueo(false); setError('') }} className="btn-outline flex-1">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg bg-[#cf5f56] text-white text-sm font-medium hover:bg-[#cf5f56]/90 transition-colors">
                  Bloquear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function MesaCard({ mesa, onSelect }: { mesa: Mesa; onSelect: () => void }) {
  return (
    <div
      className={cn(
        'relative rounded-xl border p-3 cursor-pointer',
        'transition-all duration-200 hover:scale-[1.02] hover:shadow-lg',
        mesa.reservable
          ? getTableStatusStyle(mesa.estado)
          : 'bg-gray-800/20 border-gray-700/20 text-gray-500 opacity-60',
      )}
      onClick={onSelect}
    >
      <p className="text-sm font-bold leading-none mb-1">{mesa.nombre}</p>
      <p className="text-[10px] opacity-70">{mesa.capacidad}p</p>
      <div className={cn('absolute top-1.5 right-1.5 w-2 h-2 rounded-full', STATUS_DOT[mesa.estado])} />
      {mesa.reservaActual && (
        <p className="text-[9px] mt-1.5 opacity-60 truncate leading-tight">{mesa.reservaActual.nombreCliente}</p>
      )}
      {!mesa.reservable && (
        <span className="absolute -top-1.5 -left-1.5 text-[8px] bg-gray-700 text-gray-300 px-1 py-0.5 rounded">N/R</span>
      )}
    </div>
  )
}
