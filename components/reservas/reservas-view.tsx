'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, X, ChevronDown,
  Phone, Users, CalendarClock, Ban, CheckCircle2,
  ShoppingBag, Trash2, PlusCircle, Loader2,
} from 'lucide-react'
import type { Reserva, ReservationStatus, Zone, PaymentStatus } from '@/types'
import {
  formatDateTime, formatTime, getReservationStatusStyle, getReservationStatusLabel,
  getPaymentStatusLabel, getPaymentStatusStyle, cn,
} from '@/lib/utils'

interface PreOrderItem { producto: string; cantidad: number; observaciones?: string }

interface Props { initialReservas: Reserva[] }

const ZONE_LABEL: Record<Zone, string> = {
  salon_interno: 'Salón Interno',
  terraza:       'Terraza',
}

const OCASION_OPTIONS: { value: string; label: string }[] = [
  { value: '',                     label: 'Ninguna'                 },
  { value: 'Cumpleaños',           label: 'Cumpleaños'              },
  { value: 'Aniversario',          label: 'Aniversario'             },
  { value: 'Grado',                label: 'Grado'                   },
  { value: 'Baby shower',          label: 'Baby shower'             },
  { value: 'Despedida de soltero/a', label: 'Despedida de soltero/a' },
]

const STATUS_OPTIONS: { value: ReservationStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'Todos los estados' },
  { value: 'confirmada',label: 'Confirmada'         },
  { value: 'pendiente', label: 'Pendiente'          },
  { value: 'cancelada', label: 'Cancelada'          },
  { value: 'finalizada',label: 'Finalizada'         },
  { value: 'no_asistio',label: 'No asistió'         },
]

const PAGO_OPTIONS: { value: PaymentStatus | 'all'; label: string }[] = [
  { value: 'all',             label: 'Todos los pagos'  },
  { value: 'sin_pago',        label: 'Sin pago'         },
  { value: 'abono_pendiente', label: 'Abono pendiente'  },
  { value: 'abono_pagado',    label: 'Abono pagado'     },
  { value: 'pagado_total',    label: 'Pagado total'     },
]

export function ReservasView({ initialReservas }: Props) {
  const [reservas,    setReservas]    = useState<Reserva[]>(initialReservas)
  const [search,      setSearch]      = useState('')
  const [status,      setStatus]      = useState<ReservationStatus | 'all'>('all')
  const [zone,        setZone]        = useState<Zone | 'all'>('all')
  const [pago,        setPago]        = useState<PaymentStatus | 'all'>('all')
  const [selected,    setSelected]    = useState<string | null>(null)
  const [showNew,     setShowNew]     = useState(false)
  const [preOrders,   setPreOrders]   = useState<Record<string, PreOrderItem[]>>({})
  const [loadingPO,   setLoadingPO]   = useState<string | null>(null)
  const [showPOForm,  setShowPOForm]  = useState<string | null>(null)
  const [newItem,     setNewItem]     = useState<PreOrderItem>({ producto: '', cantidad: 1 })
  const [isPending,   startTransition] = useTransition()
  const router = useRouter()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return reservas.filter(r => {
      if (search && !r.nombreCliente.toLowerCase().includes(q) && !r.telefono.includes(q)) return false
      if (status !== 'all' && r.estado !== status) return false
      if (zone   !== 'all' && r.zona   !== zone)   return false
      if (pago   !== 'all' && r.estadoPago !== pago) return false
      return true
    }).sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime())
  }, [reservas, search, status, zone, pago])

  const pagoCounts = useMemo(() => {
    const counts: Record<PaymentStatus, number> = {
      sin_pago: 0, abono_pendiente: 0, abono_pagado: 0, pagado_total: 0,
    }
    for (const r of reservas) counts[r.estadoPago]++
    return counts
  }, [reservas])

  // ── Quick actions con API ────────────────────────────────────────────────
  async function confirmReserva(id: string) {
    await fetch(`/api/reservas/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'confirmada' }),
    })
    setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: 'confirmada' } : r))
    startTransition(() => router.refresh())
  }
  async function cancelReserva(id: string) {
    await fetch(`/api/reservas/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'cancelada' }),
    })
    setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: 'cancelada' } : r))
    startTransition(() => router.refresh())
  }

  // ── Pre-pedido ───────────────────────────────────────────────────────────
  async function loadPreOrder(reservaId: string) {
    if (preOrders[reservaId] !== undefined) return
    setLoadingPO(reservaId)
    try {
      const res  = await fetch(`/api/reservas/${reservaId}/prepedido`)
      const data = await res.json()
      setPreOrders(prev => ({ ...prev, [reservaId]: data.items ?? [] }))
    } finally {
      setLoadingPO(null)
    }
  }

  function toggleDetail(id: string) {
    const next = selected === id ? null : id
    setSelected(next)
    if (next) loadPreOrder(next)
  }

  async function addPreOrderItem(reservaId: string) {
    if (!newItem.producto.trim()) return
    const updated = [...(preOrders[reservaId] ?? []), { ...newItem }]
    await fetch(`/api/reservas/${reservaId}/prepedido`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: updated }),
    })
    setPreOrders(prev => ({ ...prev, [reservaId]: updated }))
    setNewItem({ producto: '', cantidad: 1 })
    setShowPOForm(null)
  }

  async function removePreOrderItem(reservaId: string, idx: number) {
    const updated = (preOrders[reservaId] ?? []).filter((_, i) => i !== idx)
    if (updated.length === 0) {
      await fetch(`/api/reservas/${reservaId}/prepedido`, { method: 'DELETE' })
    } else {
      await fetch(`/api/reservas/${reservaId}/prepedido`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updated }),
      })
    }
    setPreOrders(prev => ({ ...prev, [reservaId]: updated }))
  }

  const selectedReserva = reservas.find(r => r.id === selected)

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#f2efe8]/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono…"
            className="input-base pl-9"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f2efe8]/30 hover:text-[#f2efe8]/60">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={status}
            onChange={e => setStatus(e.target.value as ReservationStatus | 'all')}
            className="input-base pr-8 appearance-none w-full sm:w-auto cursor-pointer"
            style={{ minWidth: 160 }}
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#f2efe8]/40 pointer-events-none" />
        </div>

        {/* Zone filter */}
        <div className="relative">
          <select
            value={zone}
            onChange={e => setZone(e.target.value as Zone | 'all')}
            className="input-base pr-8 appearance-none w-full sm:w-auto cursor-pointer"
            style={{ minWidth: 140 }}
          >
            <option value="all">Todas las zonas</option>
            <option value="salon_interno">Salón Interno</option>
            <option value="terraza">Terraza</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#f2efe8]/40 pointer-events-none" />
        </div>

        {/* Payment status filter */}
        <div className="relative">
          <select
            value={pago}
            onChange={e => setPago(e.target.value as PaymentStatus | 'all')}
            className="input-base pr-8 appearance-none w-full sm:w-auto cursor-pointer"
            style={{ minWidth: 160 }}
          >
            {PAGO_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#f2efe8]/40 pointer-events-none" />
        </div>

        {/* New button */}
        <button onClick={() => setShowNew(true)} className="btn-gold shrink-0">
          <Plus className="w-4 h-4" /> Nueva reserva
        </button>
      </div>

      {/* ── Payment summary ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(pagoCounts) as [PaymentStatus, number][]).map(([st, n]) => (
          <button
            key={st}
            onClick={() => setPago(pago === st ? 'all' : st)}
            className={cn(
              'card p-4 flex items-center justify-between text-left transition-all',
              pago === st && 'ring-1 ring-[#ccc79f]/40',
            )}
          >
            <div>
              <p className="text-lg font-semibold text-[#f2efe8] leading-none">{n}</p>
              <p className={cn('text-[10px] mt-0.5', getPaymentStatusStyle(st))}>{getPaymentStatusLabel(st)}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-[#f2efe8]/35">
        {filtered.length} reserva{filtered.length !== 1 ? 's' : ''} encontradas
      </p>

      {/* ── Table (desktop) / Cards (mobile) ────────────────────────────── */}
      <div className="card overflow-hidden">

        {/* Desktop table header */}
        <div className="hidden lg:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3 border-b bg-[rgba(0,0,0,0.2)] text-[10px] uppercase tracking-wider text-[#f2efe8]/35 font-medium"
             style={{ borderColor: 'rgba(204,199,159,0.08)' }}>
          <span>Cliente</span>
          <span>Fecha · Hora</span>
          <span>Personas</span>
          <span>Zona · Mesa</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-[#f2efe8]/35 text-sm">
            No se encontraron reservas con los filtros actuales.
          </div>
        ) : (
          <div className="divide-y divide-[rgba(204,199,159,0.08)]">
            {filtered.map(r => (
              <div
                key={r.id}
                className={cn(
                  'transition-colors hover:bg-[rgba(255,255,255,0.02)]',
                  selected === r.id && 'bg-[rgba(204,199,159,0.04)]',
                )}
              >
                {/* Desktop row */}
                <div className="hidden lg:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-4 items-center">
                  <div>
                    <p className="text-sm font-medium text-[#f2efe8]">{r.nombreCliente}</p>
                    <p className="text-xs text-[#f2efe8]/40 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {r.telefono}
                    </p>
                    {r.ocasionEspecial && (
                      <span className="badge mt-1 text-[10px] px-1.5 py-px bg-[#ccc79f]/10 text-[#ccc79f] border-[#ccc79f]/20">
                        {r.ocasionEspecial}
                      </span>
                    )}
                  </div>
                  <div className="text-right min-w-[110px]">
                    <p className="text-sm text-[#f2efe8]">{formatDateTime(r.fechaInicio)}</p>
                    <p className="text-xs text-[#f2efe8]/40">–{formatTime(r.fechaFin)}</p>
                  </div>
                  <div className="text-center min-w-[70px]">
                    <p className="text-sm text-[#f2efe8] flex items-center gap-1 justify-center">
                      <Users className="w-3.5 h-3.5 text-[#f2efe8]/40" /> {r.personas}
                    </p>
                  </div>
                  <div className="min-w-[110px]">
                    <p className="text-xs text-[#f2efe8]/70">{ZONE_LABEL[r.zona]}</p>
                    <p className="text-xs text-[#ccc79f]/70 mt-0.5">{r.mesas.join(' + ')}</p>
                  </div>
                  <div className="min-w-[100px]">
                    <span className={cn('badge text-xs px-2 py-0.5', getReservationStatusStyle(r.estado))}>
                      {getReservationStatusLabel(r.estado)}
                    </span>
                    <p className={cn('text-[10px] mt-1', getPaymentStatusStyle(r.estadoPago))}>
                      {getPaymentStatusLabel(r.estadoPago)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleDetail(r.id)}
                      className="btn-ghost p-1.5 rounded-lg" title="Ver detalle"
                    >
                      <CalendarClock className="w-4 h-4" />
                    </button>
                    {r.estado === 'pendiente' && (
                      <button onClick={() => confirmReserva(r.id)} className="btn-ghost p-1.5 rounded-lg text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-400/10" title="Confirmar">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    {(r.estado === 'confirmada' || r.estado === 'pendiente') && (
                      <button onClick={() => cancelReserva(r.id)} className="btn-ghost p-1.5 rounded-lg text-[#cf5f56]/60 hover:text-[#cf5f56] hover:bg-[#cf5f56]/10" title="Cancelar">
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile card */}
                <div className="lg:hidden p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[#f2efe8]">{r.nombreCliente}</p>
                      <p className="text-xs text-[#f2efe8]/40 mt-0.5">{formatDateTime(r.fechaInicio)} · {r.personas}p</p>
                      <p className="text-xs text-[#f2efe8]/40">{ZONE_LABEL[r.zona]} · {r.mesas.join('+')}</p>
                    </div>
                    <span className={cn('badge text-[10px] shrink-0', getReservationStatusStyle(r.estado))}>
                      {getReservationStatusLabel(r.estado)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleDetail(r.id)} className="btn-ghost text-xs py-1 px-2 flex-1">
                      {selected === r.id ? 'Ocultar' : 'Ver detalle'}
                    </button>
                    {r.estado === 'pendiente' && (
                      <button onClick={() => confirmReserva(r.id)} className="text-xs py-1 px-3 rounded-lg bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                        Confirmar
                      </button>
                    )}
                    {(r.estado === 'confirmada' || r.estado === 'pendiente') && (
                      <button onClick={() => cancelReserva(r.id)} className="text-xs py-1 px-3 rounded-lg bg-[#cf5f56]/10 text-[#cf5f56] border border-[#cf5f56]/20">
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {selected === r.id && (
                  <div className="px-5 pb-4 pt-3 bg-[rgba(0,0,0,0.15)] border-t animate-fade-in"
                       style={{ borderColor: 'rgba(204,199,159,0.08)' }}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mb-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#f2efe8]/30 mb-1">Teléfono</p>
                        <p className="text-[#f2efe8]/70">{r.telefono}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#f2efe8]/30 mb-1">Pago</p>
                        <p className={getPaymentStatusStyle(r.estadoPago)}>{getPaymentStatusLabel(r.estadoPago)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#f2efe8]/30 mb-1">Fuente</p>
                        <p className="text-[#f2efe8]/70">
                          {r.fuente === 'ia_whatsapp' ? '🤖 IA · WhatsApp' : r.fuente === 'admin' ? '👤 Admin' : '👤 Staff'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#f2efe8]/30 mb-1">Creada</p>
                        <p className="text-[#f2efe8]/70">{formatDateTime(r.creadaEn)}</p>
                      </div>
                      {r.alergenos && (
                        <div className="col-span-full">
                          <p className="text-[10px] uppercase tracking-wider text-[#f2efe8]/30 mb-1">Alérgenos</p>
                          <p className="text-[#cf5f56]/80">{r.alergenos}</p>
                        </div>
                      )}
                      {r.notas && (
                        <div className="col-span-full">
                          <p className="text-[10px] uppercase tracking-wider text-[#f2efe8]/30 mb-1">Notas</p>
                          <p className="text-[#f2efe8]/60">{r.notas}</p>
                        </div>
                      )}
                    </div>

                    {/* Pre-pedido */}
                    <div className="border-t pt-3" style={{ borderColor: 'rgba(204,199,159,0.08)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] uppercase tracking-wider text-[#f2efe8]/30 flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" /> Pre-pedido
                        </p>
                        {r.estado !== 'cancelada' && r.estado !== 'finalizada' && (
                          <button
                            onClick={() => setShowPOForm(showPOForm === r.id ? null : r.id)}
                            className="text-[10px] text-[#ccc79f]/60 hover:text-[#ccc79f] flex items-center gap-1 transition-colors"
                          >
                            <PlusCircle className="w-3 h-3" /> Agregar
                          </button>
                        )}
                      </div>

                      {loadingPO === r.id ? (
                        <div className="flex justify-center py-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#f2efe8]/30" />
                        </div>
                      ) : (preOrders[r.id] ?? []).length === 0 ? (
                        <p className="text-[10px] text-[#f2efe8]/25 italic">Sin pre-pedido registrado.</p>
                      ) : (
                        <div className="space-y-1">
                          {(preOrders[r.id] ?? []).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-lg bg-[rgba(0,0,0,0.2)] px-3 py-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] font-bold text-[#ccc79f]/80 shrink-0">{item.cantidad}×</span>
                                <span className="text-xs text-[#f2efe8]/70 truncate">{item.producto}</span>
                                {item.observaciones && (
                                  <span className="text-[10px] text-[#f2efe8]/35 truncate">({item.observaciones})</span>
                                )}
                              </div>
                              {r.estado !== 'cancelada' && r.estado !== 'finalizada' && (
                                <button
                                  onClick={() => removePreOrderItem(r.id, idx)}
                                  className="shrink-0 ml-2 text-[#f2efe8]/20 hover:text-[#cf5f56]/70 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {showPOForm === r.id && (
                        <div className="mt-2 flex gap-2">
                          <input
                            value={newItem.producto}
                            onChange={e => setNewItem(p => ({ ...p, producto: e.target.value }))}
                            placeholder="Producto…"
                            className="input-base text-xs flex-1 py-1.5"
                            onKeyDown={e => e.key === 'Enter' && addPreOrderItem(r.id)}
                          />
                          <input
                            type="number" min={1} max={20}
                            value={newItem.cantidad}
                            onChange={e => setNewItem(p => ({ ...p, cantidad: Number(e.target.value) }))}
                            className="input-base text-xs w-14 py-1.5 text-center"
                          />
                          <input
                            value={newItem.observaciones ?? ''}
                            onChange={e => setNewItem(p => ({ ...p, observaciones: e.target.value }))}
                            placeholder="Obs…"
                            className="input-base text-xs w-24 py-1.5"
                          />
                          <button
                            onClick={() => addPreOrderItem(r.id)}
                            className="shrink-0 px-2.5 rounded-lg bg-[#ccc79f]/15 text-[#ccc79f] hover:bg-[#ccc79f]/25 transition-colors text-xs"
                          >
                            OK
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── New Reservation Modal ──────────────────────────────────────── */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="relative z-10 w-full max-w-lg bg-[#19191c] rounded-2xl border shadow-2xl animate-slide-in"
               style={{ borderColor: 'rgba(204,199,159,0.12)' }}>
            <div className="flex items-center justify-between p-5 border-b"
                 style={{ borderColor: 'rgba(204,199,159,0.1)' }}>
              <h3 className="font-semibold text-[#f2efe8]">Nueva Reserva</h3>
              <button onClick={() => setShowNew(false)} className="btn-ghost p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <NewReservationForm onClose={() => setShowNew(false)} onSave={r => {
              setReservas(prev => [r, ...prev])
              setShowNew(false)
            }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Inline form ─────────────────────────────────────────────────────────────

function NewReservationForm({ onClose, onSave }: {
  onClose: () => void
  onSave: (r: Reserva) => void
}) {
  const [form, setForm] = useState({
    nombreCliente: '', telefono: '', personas: 2,
    fecha: '', hora: '',
    ocasionEspecial: '', alergenos: '', notas: '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  function set(key: string, val: string | number) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreCliente:   form.nombreCliente,
          telefono:        form.telefono,
          personas:        Number(form.personas),
          fecha:           form.fecha,
          hora:            form.hora,
          ocasionEspecial: form.ocasionEspecial || undefined,
          alergenos:       form.alergenos || undefined,
          notas:           form.notas || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'No se pudo crear la reserva.')
        return
      }
      onSave(data as Reserva)
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Nombre del cliente</label>
          <input required value={form.nombreCliente} onChange={e => set('nombreCliente', e.target.value)}
                 className="input-base" placeholder="Nombre completo" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Teléfono</label>
          <input required value={form.telefono} onChange={e => set('telefono', e.target.value)}
                 className="input-base" placeholder="300 000 0000" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Personas</label>
          <input required type="number" min={1} max={20} value={form.personas}
                 onChange={e => set('personas', Number(e.target.value))}
                 className="input-base" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Fecha</label>
          <input required type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)}
                 className="input-base" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Hora</label>
          <input required type="time" value={form.hora} onChange={e => set('hora', e.target.value)}
                 className="input-base" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Ocasión especial</label>
          <div className="relative">
            <select value={form.ocasionEspecial} onChange={e => set('ocasionEspecial', e.target.value)}
                    className="input-base pr-7 appearance-none cursor-pointer w-full">
              {OCASION_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#f2efe8]/40 pointer-events-none" />
          </div>
        </div>
        <div className="col-span-2 space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Alérgenos</label>
          <input value={form.alergenos} onChange={e => set('alergenos', e.target.value)}
                 className="input-base" placeholder="Gluten, mariscos, frutos secos…" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Notas</label>
          <textarea value={form.notas} onChange={e => set('notas', e.target.value)}
                    className="input-base resize-none" rows={2} placeholder="Observaciones adicionales…" />
        </div>
      </div>
      {error && (
        <p className="text-xs text-[#cf5f56] bg-[#cf5f56]/10 border border-[#cf5f56]/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="btn-outline flex-1" disabled={saving}>Cancelar</button>
        <button type="submit" className="btn-gold flex-1" disabled={saving}>
          {saving ? 'Creando…' : 'Crear reserva'}
        </button>
      </div>
    </form>
  )
}
