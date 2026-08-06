'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package as PackageIcon, ChevronDown, Plus, X, Trash2, Pencil,
  AlertTriangle, ShoppingCart, TrendingUp, Calendar,
} from 'lucide-react'
import type { Paquete, VentaPaquete } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  initialPaquetes: Paquete[]
  initialVentas: VentaPaquete[]
}

function formatCOP(n: number) {
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}

export function PaquetesView({ initialPaquetes, initialVentas }: Props) {
  const [paquetes, setPaquetes] = useState<Paquete[]>(initialPaquetes)
  const [ventas,   setVentas]   = useState<VentaPaquete[]>(initialVentas)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState<Paquete | null>(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', costo: '' })
  const [error,    setError]    = useState('')

  const [showVenta, setShowVenta] = useState<string | null>(null) // packageId
  const [ventaForm, setVentaForm] = useState({ cliente: '', cantidad: 1, fecha: new Date().toISOString().split('T')[0] })

  const hoy = new Date().toISOString().split('T')[0]
  const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const [desde, setDesde] = useState(primerDiaMes)
  const [hasta, setHasta] = useState(hoy)

  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // ── Consolidado del periodo seleccionado ──────────────────────────────
  const ventasFiltradas = useMemo(() => {
    return ventas.filter(v => {
      const f = v.fecha.split('T')[0]
      return f >= desde && f <= hasta
    })
  }, [ventas, desde, hasta])

  const consolidado = useMemo(() => {
    const totalVentas = ventasFiltradas.length
    const totalMonto  = ventasFiltradas.reduce((a, v) => a + v.montoTotal, 0)
    const porPaquete: Record<string, { nombre: string; cantidad: number; monto: number }> = {}
    for (const v of ventasFiltradas) {
      if (!porPaquete[v.packageId]) porPaquete[v.packageId] = { nombre: v.paqueteNombre, cantidad: 0, monto: 0 }
      porPaquete[v.packageId].cantidad += v.cantidad
      porPaquete[v.packageId].monto += v.montoTotal
    }
    return { totalVentas, totalMonto, porPaquete: Object.values(porPaquete) }
  }, [ventasFiltradas])

  // ── CRUD paquete ───────────────────────────────────────────────────────
  function openNew() {
    setEditing(null)
    setForm({ nombre: '', descripcion: '', costo: '' })
    setError('')
    setShowForm(true)
  }

  function openEdit(p: Paquete) {
    setEditing(p)
    setForm({ nombre: p.nombre, descripcion: p.descripcion ?? '', costo: String(p.costo) })
    setError('')
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const costo = Number(form.costo)
    if (!form.nombre.trim() || !costo || costo <= 0) {
      setError('Nombre y costo (mayor a 0) son requeridos.')
      return
    }

    if (editing) {
      const res = await fetch(`/api/paquetes/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: form.nombre, descripcion: form.descripcion || undefined, costo }),
      })
      if (!res.ok) { setError('Error al guardar.'); return }
      const { paquete } = await res.json()
      setPaquetes(prev => prev.map(p => p.id === editing.id ? { ...p, ...paquete, descripcion: paquete.descripcion ?? undefined } : p))
    } else {
      const res = await fetch('/api/paquetes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: form.nombre, descripcion: form.descripcion || undefined, costo }),
      })
      if (!res.ok) { setError('Error al guardar.'); return }
      const { paquete } = await res.json()
      setPaquetes(prev => [...prev, { ...paquete, descripcion: paquete.descripcion ?? undefined, creadaEn: paquete.createdAt }])
    }

    setShowForm(false)
    startTransition(() => router.refresh())
  }

  async function toggleActivo(p: Paquete) {
    const res = await fetch(`/api/paquetes/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !p.activo }),
    })
    if (!res.ok) return
    setPaquetes(prev => prev.map(x => x.id === p.id ? { ...x, activo: !x.activo } : x))
    startTransition(() => router.refresh())
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/paquetes/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    const data = await res.json()
    if (data.desactivado) {
      setPaquetes(prev => prev.map(p => p.id === id ? { ...p, activo: false } : p))
    } else {
      setPaquetes(prev => prev.filter(p => p.id !== id))
    }
    startTransition(() => router.refresh())
  }

  // ── Registrar venta ──────────────────────────────────────────────────
  async function handleRegistrarVenta(p: Paquete, e: React.FormEvent) {
    e.preventDefault()
    const cantidad = Math.max(1, Number(ventaForm.cantidad) || 1)
    const montoTotal = p.costo * cantidad
    const res = await fetch('/api/paquetes/ventas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageId: p.id, cliente: ventaForm.cliente || undefined,
        cantidad, montoTotal, fecha: `${ventaForm.fecha}T12:00:00`,
      }),
    })
    if (!res.ok) return
    const { venta } = await res.json()
    setVentas(prev => [venta, ...prev])
    setVentaForm({ cliente: '', cantidad: 1, fecha: hoy })
    setShowVenta(null)
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Consolidado por periodo ──────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#ccc79f]" />
            <h2 className="text-sm font-semibold text-[#f2efe8]">Consolidado de Ventas</h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#f2efe8]/30" />
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
                   className="input-base text-xs py-1.5" style={{ minWidth: 130 }} />
            <span className="text-[#f2efe8]/30">a</span>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
                   className="input-base text-xs py-1.5" style={{ minWidth: 130 }} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="rounded-xl bg-[rgba(0,0,0,0.15)] border p-3" style={{ borderColor: 'rgba(204,199,159,0.08)' }}>
            <p className="text-lg font-semibold text-[#f2efe8]">{consolidado.totalVentas}</p>
            <p className="text-[10px] text-[#f2efe8]/35">Ventas en el periodo</p>
          </div>
          <div className="rounded-xl bg-[rgba(0,0,0,0.15)] border p-3" style={{ borderColor: 'rgba(204,199,159,0.08)' }}>
            <p className="text-lg font-semibold text-[#ccc79f]">{formatCOP(consolidado.totalMonto)}</p>
            <p className="text-[10px] text-[#f2efe8]/35">Total vendido</p>
          </div>
        </div>

        {consolidado.porPaquete.length > 0 ? (
          <div className="space-y-1.5">
            {consolidado.porPaquete.map(pp => (
              <div key={pp.nombre} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-[rgba(0,0,0,0.1)]">
                <span className="text-[#f2efe8]/70">{pp.nombre} <span className="text-[#f2efe8]/30">×{pp.cantidad}</span></span>
                <span className="text-[#ccc79f]/80 font-medium">{formatCOP(pp.monto)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#f2efe8]/25 italic">Sin ventas registradas en este periodo.</p>
        )}
      </div>

      {/* ── Catálogo de paquetes ─────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <PackageIcon className="w-4 h-4 text-[#ccc79f]" />
            <h2 className="text-sm font-semibold text-[#f2efe8]">Paquetes que vendemos</h2>
          </div>
          <button onClick={openNew} className="flex items-center gap-1.5 text-xs text-[#ccc79f]/70 hover:text-[#ccc79f] transition-colors">
            <Plus className="w-3.5 h-3.5" /> Agregar paquete
          </button>
        </div>

        {paquetes.length === 0 ? (
          <p className="text-xs text-[#f2efe8]/25 italic">No hay paquetes registrados todavía.</p>
        ) : (
          <div className="space-y-2">
            {paquetes.map(p => {
              const isOpen = expanded === p.id
              return (
                <div key={p.id} className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(204,199,159,0.08)' }}>
                  {/* Header — lista desplegable */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : p.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
                      p.activo ? 'bg-[rgba(0,0,0,0.12)]' : 'bg-[rgba(0,0,0,0.12)] opacity-45',
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ChevronDown className={cn('w-3.5 h-3.5 text-[#f2efe8]/40 shrink-0 transition-transform', isOpen && 'rotate-180')} />
                      <span className="text-sm font-medium text-[#f2efe8] truncate">{p.nombre}</span>
                      {!p.activo && <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 shrink-0">Inactivo</span>}
                    </div>
                    <span className="text-sm text-[#ccc79f] shrink-0 ml-3">{formatCOP(p.costo)}</span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t animate-fade-in" style={{ borderColor: 'rgba(204,199,159,0.08)' }}>
                      {p.descripcion && <p className="text-xs text-[#f2efe8]/55 mt-3 mb-3">{p.descripcion}</p>}

                      <div className="flex flex-wrap gap-2 mt-3">
                        <button onClick={() => setShowVenta(showVenta === p.id ? null : p.id)}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#ccc79f]/10 text-[#ccc79f] border border-[#ccc79f]/20 hover:bg-[#ccc79f]/20 transition-colors">
                          <ShoppingCart className="w-3.5 h-3.5" /> Registrar venta
                        </button>
                        <button onClick={() => openEdit(p)}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] text-[#f2efe8]/60 border border-[rgba(255,255,255,0.08)] hover:text-[#f2efe8] transition-colors">
                          <Pencil className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button onClick={() => toggleActivo(p)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] text-[#f2efe8]/60 border border-[rgba(255,255,255,0.08)] hover:text-[#f2efe8] transition-colors">
                          {p.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button onClick={() => handleDelete(p.id)}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-[#cf5f56]/70 border border-[#cf5f56]/20 hover:bg-[#cf5f56]/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                      </div>

                      {showVenta === p.id && (
                        <form onSubmit={e => handleRegistrarVenta(p, e)} className="mt-3 flex flex-wrap items-end gap-2 rounded-lg bg-[rgba(0,0,0,0.15)] p-3">
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-wider text-[#f2efe8]/40">Cliente (opcional)</label>
                            <input value={ventaForm.cliente} onChange={e => setVentaForm(v => ({ ...v, cliente: e.target.value }))}
                                   className="input-base text-xs py-1.5 w-32" placeholder="Nombre" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-wider text-[#f2efe8]/40">Cantidad</label>
                            <input type="number" min={1} value={ventaForm.cantidad}
                                   onChange={e => setVentaForm(v => ({ ...v, cantidad: Number(e.target.value) }))}
                                   className="input-base text-xs py-1.5 w-16" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-wider text-[#f2efe8]/40">Fecha</label>
                            <input type="date" value={ventaForm.fecha}
                                   onChange={e => setVentaForm(v => ({ ...v, fecha: e.target.value }))}
                                   className="input-base text-xs py-1.5" />
                          </div>
                          <button type="submit" className="btn-gold text-xs px-3 py-1.5">Registrar</button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modal crear/editar paquete ──────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-sm bg-[#19191c] rounded-2xl border shadow-2xl animate-slide-in"
               style={{ borderColor: 'rgba(204,199,159,0.12)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(204,199,159,0.1)' }}>
              <h3 className="font-semibold text-[#f2efe8]">{editing ? 'Editar Paquete' : 'Nuevo Paquete'}</h3>
              <button onClick={() => setShowForm(false)} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Nombre</label>
                <input required value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                       className="input-base" placeholder="Paquete decoración…" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                          className="input-base resize-none" rows={3} placeholder="Qué incluye el paquete…" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Costo (COP)</label>
                <input required type="number" min={0} value={form.costo}
                       onChange={e => setForm(p => ({ ...p, costo: e.target.value }))}
                       className="input-base" placeholder="150000" />
              </div>
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-[#cf5f56]/10 border border-[#cf5f56]/25 px-3 py-2 text-xs text-[#cf5f56]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Cancelar</button>
                <button type="submit" disabled={isPending} className="btn-gold flex-1">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
