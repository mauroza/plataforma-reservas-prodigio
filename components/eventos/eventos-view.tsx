'use client'

import { useState, useMemo } from 'react'
import {
  Plus, X, ChevronDown, Users, CalendarRange,
  Clock, CreditCard, Utensils, CheckCircle2, XCircle,
} from 'lucide-react'
import type { Evento, EventStatus } from '@/types'
import {
  formatDateTime, formatTime, formatDateShort, formatCurrency,
  getEventStatusStyle, getEventStatusLabel, getPaymentStatusStyle,
  getPaymentStatusLabel, cn,
} from '@/lib/utils'

interface Props { initialEventos: Evento[] }

const MENU_LABEL: Record<string, string> = {
  menu_90k:    'Lomo / Salmón / Chaufa — $90.000/p',
  menu_75k:    'Pollo Grill / Ensalada — $75.000/p',
  sin_definir: 'Sin definir',
}

const STATUS_OPTS: { value: EventStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'Todos'      },
  { value: 'pendiente', label: 'Pendiente'  },
  { value: 'confirmado',label: 'Confirmado' },
  { value: 'finalizado',label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado'  },
]

export function EventosView({ initialEventos }: Props) {
  const [eventos,  setEventos]  = useState<Evento[]>(initialEventos)
  const [status,   setStatus]   = useState<EventStatus | 'all'>('all')
  const [showNew,  setShowNew]  = useState(false)
  const [selected, setSelected] = useState<Evento | null>(null)

  const filtered = useMemo(() =>
    eventos.filter(e => status === 'all' || e.estado === status)
      .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()),
    [eventos, status]
  )

  function confirmEvent(id: string) {
    setEventos(prev => prev.map(e => e.id === id ? { ...e, estado: 'confirmado' as EventStatus } : e))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, estado: 'confirmado' } : null)
  }

  function cancelEvent(id: string) {
    setEventos(prev => prev.map(e => e.id === id ? { ...e, estado: 'cancelado' as EventStatus } : e))
    setSelected(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header / actions ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status tabs */}
        <div className="flex gap-1 p-1 bg-[#19191c] rounded-xl border w-fit" style={{ borderColor: 'rgba(204,199,159,0.08)' }}>
          {STATUS_OPTS.map(o => (
            <button
              key={o.value}
              onClick={() => setStatus(o.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                status === o.value
                  ? 'bg-[#ccc79f] text-[#0c0c0d]'
                  : 'text-[#f2efe8]/50 hover:text-[#f2efe8]',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        <button onClick={() => setShowNew(true)} className="btn-gold shrink-0 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Nuevo evento
        </button>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total eventos',   value: eventos.length },
          { label: 'Confirmados',     value: eventos.filter(e => e.estado === 'confirmado').length },
          { label: 'Pendientes',      value: eventos.filter(e => e.estado === 'pendiente').length },
          { label: 'Total personas',  value: eventos.filter(e => e.estado !== 'cancelado').reduce((s, e) => s + e.personas, 0) },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-2xl font-semibold text-[#f2efe8]">{s.value}</p>
            <p className="text-[10px] text-[#f2efe8]/40 mt-0.5 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Event cards grid ─────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <CalendarRange className="w-10 h-10 text-[#f2efe8]/15 mb-3" />
          <p className="text-[#f2efe8]/35 text-sm">No hay eventos con este estado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(ev => (
            <EventCard
              key={ev.id}
              evento={ev}
              onSelect={() => setSelected(ev)}
              onConfirm={() => confirmEvent(ev.id)}
              onCancel={() => cancelEvent(ev.id)}
            />
          ))}
        </div>
      )}

      {/* ── Detail modal ─────────────────────────────────────────────── */}
      {selected && (
        <EventDetailModal
          evento={selected}
          onClose={() => setSelected(null)}
          onConfirm={() => confirmEvent(selected.id)}
          onCancel={() => cancelEvent(selected.id)}
        />
      )}

      {/* ── New event modal ───────────────────────────────────────────── */}
      {showNew && (
        <NewEventModal
          onClose={() => setShowNew(false)}
          onSave={ev => {
            setEventos(prev => [ev, ...prev])
            setShowNew(false)
          }}
        />
      )}
    </div>
  )
}

// ── Event card ───────────────────────────────────────────────────────────────

function EventCard({ evento: ev, onSelect, onConfirm, onCancel }: {
  evento: Evento
  onSelect: () => void
  onConfirm: () => void
  onCancel: () => void
}) {
  const isCancelled = ev.estado === 'cancelado'

  return (
    <div
      className={cn(
        'card card-hover p-5 flex flex-col gap-4 cursor-pointer',
        isCancelled && 'opacity-60',
      )}
      onClick={onSelect}
    >
      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[#f2efe8] leading-tight">{ev.nombre}</p>
          <p className="text-xs text-[#f2efe8]/45 mt-0.5">{ev.empresaPersona}</p>
        </div>
        <span className={cn('badge text-[10px] px-2 py-0.5 shrink-0', getEventStatusStyle(ev.estado))}>
          {getEventStatusLabel(ev.estado)}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2 text-xs text-[#f2efe8]/55">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-3.5 h-3.5 shrink-0 text-[#ccc79f]/60" />
          <span>{formatDateShort(ev.fechaInicio)} · {formatTime(ev.fechaInicio)} – {formatTime(ev.fechaFin)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 shrink-0 text-[#ccc79f]/60" />
          <span>{ev.personas} personas · {ev.tipoEvento}</span>
        </div>
        <div className="flex items-center gap-2">
          <Utensils className="w-3.5 h-3.5 shrink-0 text-[#ccc79f]/60" />
          <span className="truncate">{MENU_LABEL[ev.opcionMenu]}</span>
        </div>
        {ev.montoTotal && (
          <div className="flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5 shrink-0 text-[#ccc79f]/60" />
            <span className={getPaymentStatusStyle(ev.estadoPago)}>
              {formatCurrency(ev.montoTotal)} · {getPaymentStatusLabel(ev.estadoPago)}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {!isCancelled && ev.estado !== 'finalizado' && (
        <div className="flex gap-2 pt-1 border-t" style={{ borderColor: 'rgba(204,199,159,0.08)' }}
             onClick={e => e.stopPropagation()}>
          {ev.estado === 'pendiente' && (
            <button
              onClick={onConfirm}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 hover:bg-emerald-400/20 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar
            </button>
          )}
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium bg-[#cf5f56]/10 text-[#cf5f56] border border-[#cf5f56]/20 hover:bg-[#cf5f56]/20 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" /> Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

// ── Detail modal ─────────────────────────────────────────────────────────────

function EventDetailModal({ evento: ev, onClose, onConfirm, onCancel }: {
  evento: Evento
  onClose: () => void
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-lg bg-[#19191c] rounded-2xl border shadow-2xl animate-slide-in max-h-[90vh] overflow-y-auto"
        style={{ borderColor: 'rgba(204,199,159,0.12)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b sticky top-0 bg-[#19191c]"
             style={{ borderColor: 'rgba(204,199,159,0.1)' }}>
          <div className="flex-1 min-w-0 pr-4">
            <p className="font-semibold text-[#f2efe8] text-base leading-tight">{ev.nombre}</p>
            <p className="text-xs text-[#f2efe8]/45 mt-0.5">{ev.empresaPersona}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn('badge text-xs', getEventStatusStyle(ev.estado))}>
              {getEventStatusLabel(ev.estado)}
            </span>
            <button onClick={onClose} className="btn-ghost p-1.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Grid info */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Fecha inicio',  value: formatDateTime(ev.fechaInicio) },
              { label: 'Fecha fin',     value: formatDateTime(ev.fechaFin)    },
              { label: 'Personas',      value: `${ev.personas} personas`       },
              { label: 'Tipo',          value: ev.tipoEvento                   },
              { label: 'Menú elegido',  value: MENU_LABEL[ev.opcionMenu]       },
              { label: 'Estado pago',   value: getPaymentStatusLabel(ev.estadoPago) },
            ].map(row => (
              <div key={row.label}>
                <p className="text-[10px] uppercase tracking-wider text-[#f2efe8]/30 mb-1">{row.label}</p>
                <p className="text-sm text-[#f2efe8]/80">{row.value}</p>
              </div>
            ))}
          </div>

          {/* Financial */}
          {(ev.montoTotal || ev.montoAbono) && (
            <div className="rounded-xl bg-[rgba(0,0,0,0.2)] border p-4 grid grid-cols-2 gap-4"
                 style={{ borderColor: 'rgba(204,199,159,0.07)' }}>
              {ev.montoTotal && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#f2efe8]/30 mb-1">Total evento</p>
                  <p className="text-lg font-semibold text-[#ccc79f]">{formatCurrency(ev.montoTotal)}</p>
                </div>
              )}
              {ev.montoAbono && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#f2efe8]/30 mb-1">Abono (50%)</p>
                  <p className="text-lg font-semibold text-emerald-400">{formatCurrency(ev.montoAbono)}</p>
                </div>
              )}
            </div>
          )}

          {/* Special needs */}
          {ev.necesidadesEspeciales && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#f2efe8]/30 mb-1.5">Necesidades especiales</p>
              <p className="text-sm text-[#f2efe8]/65 bg-[rgba(0,0,0,0.2)] rounded-xl p-3 border"
                 style={{ borderColor: 'rgba(204,199,159,0.07)' }}>
                {ev.necesidadesEspeciales}
              </p>
            </div>
          )}

          {/* Notes */}
          {ev.notas && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#f2efe8]/30 mb-1.5">Notas internas</p>
              <p className="text-sm text-[#f2efe8]/55">{ev.notas}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {ev.estado !== 'cancelado' && ev.estado !== 'finalizado' && (
          <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'rgba(204,199,159,0.1)' }}>
            {ev.estado === 'pendiente' && (
              <button onClick={onConfirm} className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/25 hover:bg-emerald-400/20 transition-colors">
                <CheckCircle2 className="w-4 h-4" /> Confirmar evento
              </button>
            )}
            <button onClick={onCancel} className="btn-danger flex-1 justify-center">
              <XCircle className="w-4 h-4" /> Cancelar evento
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── New event modal ──────────────────────────────────────────────────────────

function NewEventModal({ onClose, onSave }: {
  onClose: () => void
  onSave: (ev: Evento) => void
}) {
  const [form, setForm] = useState({
    nombre: '', empresaPersona: '', personas: 20,
    fechaInicio: '', horaInicio: '', fechaFin: '', horaFin: '',
    tipoEvento: 'Corporativo', opcionMenu: 'sin_definir' as Evento['opcionMenu'],
    necesidadesEspeciales: '', notas: '',
  })

  function set(k: string, v: string | number) { setForm(prev => ({ ...prev, [k]: v })) }

  function save(e: React.FormEvent) {
    e.preventDefault()
    const fechaInicio = `${form.fechaInicio}T${form.horaInicio}:00`
    const fechaFin    = `${form.fechaFin}T${form.horaFin}:00`
    const pxp = form.opcionMenu === 'menu_90k' ? 90_000 : form.opcionMenu === 'menu_75k' ? 75_000 : 0
    const montoTotal = pxp > 0 ? pxp * Number(form.personas) : undefined
    const nuevo: Evento = {
      id: `e${Date.now()}`,
      nombre: form.nombre,
      empresaPersona: form.empresaPersona,
      personas: Number(form.personas),
      fechaInicio, fechaFin,
      tipoEvento: form.tipoEvento,
      opcionMenu: form.opcionMenu,
      estadoPago: 'sin_pago',
      montoTotal,
      montoAbono: montoTotal ? montoTotal * 0.5 : undefined,
      necesidadesEspeciales: form.necesidadesEspeciales || undefined,
      notas: form.notas || undefined,
      estado: 'pendiente',
      creadaEn: new Date().toISOString(),
    }
    onSave(nuevo)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-lg bg-[#19191c] rounded-2xl border shadow-2xl animate-slide-in max-h-[90vh] overflow-y-auto"
        style={{ borderColor: 'rgba(204,199,159,0.12)' }}
      >
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-[#19191c]"
             style={{ borderColor: 'rgba(204,199,159,0.1)' }}>
          <h3 className="font-semibold text-[#f2efe8]">Nuevo Evento</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={save} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Nombre del evento</label>
              <input required value={form.nombre} onChange={e => set('nombre', e.target.value)} className="input-base" placeholder="Ej: Cumpleaños Corporativo…" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Empresa / Persona</label>
              <input required value={form.empresaPersona} onChange={e => set('empresaPersona', e.target.value)} className="input-base" placeholder="Razón social o nombre" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Personas</label>
              <input required type="number" min={20} value={form.personas} onChange={e => set('personas', Number(e.target.value))} className="input-base" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Tipo de evento</label>
              <div className="relative">
                <select value={form.tipoEvento} onChange={e => set('tipoEvento', e.target.value)} className="input-base pr-7 appearance-none w-full">
                  <option>Corporativo</option>
                  <option>Social / Familiar</option>
                  <option>Aniversario</option>
                  <option>Grado</option>
                  <option>Otro</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#f2efe8]/40 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Fecha inicio</label>
              <input required type="date" value={form.fechaInicio} onChange={e => set('fechaInicio', e.target.value)} className="input-base" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Hora inicio</label>
              <input required type="time" value={form.horaInicio} onChange={e => set('horaInicio', e.target.value)} className="input-base" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Fecha fin</label>
              <input required type="date" value={form.fechaFin} onChange={e => set('fechaFin', e.target.value)} className="input-base" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Hora fin</label>
              <input required type="time" value={form.horaFin} onChange={e => set('horaFin', e.target.value)} className="input-base" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Opción de menú</label>
              <div className="relative">
                <select value={form.opcionMenu} onChange={e => set('opcionMenu', e.target.value)} className="input-base pr-7 appearance-none w-full">
                  <option value="sin_definir">Sin definir aún</option>
                  <option value="menu_90k">Lomo / Salmón / Chaufa — $90.000/persona</option>
                  <option value="menu_75k">Pollo Grill / Ensalada — $75.000/persona</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#f2efe8]/40 pointer-events-none" />
              </div>
            </div>
            {form.opcionMenu !== 'sin_definir' && (
              <div className="col-span-2 rounded-xl bg-[#ccc79f]/8 border border-[#ccc79f]/15 p-3 text-xs text-[#ccc79f]/75">
                Monto estimado: <strong>{formatCurrency((form.opcionMenu === 'menu_90k' ? 90_000 : 75_000) * Number(form.personas))}</strong> · Abono 50%: <strong>{formatCurrency((form.opcionMenu === 'menu_90k' ? 45_000 : 37_500) * Number(form.personas))}</strong>
              </div>
            )}
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Necesidades especiales</label>
              <textarea value={form.necesidadesEspeciales} onChange={e => set('necesidadesEspeciales', e.target.value)} className="input-base resize-none" rows={2} placeholder="Decoración, música, equipo AV…" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancelar</button>
            <button type="submit" className="btn-gold flex-1">Crear evento</button>
          </div>
        </form>
      </div>
    </div>
  )
}
