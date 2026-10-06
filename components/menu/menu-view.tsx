'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UtensilsCrossed, RefreshCw, Search, Pencil, Leaf, Flame, Users, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MenuItemDTO {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  categoria: string
  subcategoria: string | null
  orden: number
  esAlcoholico: boolean
  esNuevo: boolean
  alergenos: string | null
  vegetariano: boolean
  picante: boolean
  paraCompartir: boolean
  notaAgente: string | null
  disponibleHoy: boolean
  enCluvi: boolean
  agotadoCluvi: boolean
}

interface Props { initialItems: MenuItemDTO[] }

interface EditForm {
  alergenos: string
  vegetariano: boolean
  picante: boolean
  paraCompartir: boolean
  notaAgente: string
}

const normalizar = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const formatCOP = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export function MenuView({ initialItems }: Props) {
  const [items, setItems]       = useState(initialItems)
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('todas')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm]         = useState<EditForm | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)
  const [mensaje, setMensaje]   = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const router = useRouter()

  const categorias = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const i of items) mapa.set(i.categoria, (mapa.get(i.categoria) ?? 0) + 1)
    return Array.from(mapa.entries())
  }, [items])

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return items.filter(i => {
      if (categoria !== 'todas' && i.categoria !== categoria) return false
      if (!q) return true
      return normalizar(`${i.nombre} ${i.descripcion ?? ''} ${i.subcategoria ?? ''}`).includes(q)
    })
  }, [items, busqueda, categoria])

  const noDisponibles = items.filter(i => !i.disponibleHoy).length

  async function sincronizar() {
    setSincronizando(true)
    setMensaje(null)
    try {
      const res = await fetch('/api/menu/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setMensaje({ tipo: 'error', texto: data.error ?? 'No se pudo sincronizar.' })
        return
      }
      const lista = await fetch('/api/menu').then(r => r.json())
      setItems(lista.items)
      setMensaje({
        tipo: 'ok',
        texto: `Sincronizado: ${data.total} platos (${data.creados} nuevos, ${data.actualizados} actualizados, ${data.marcadosFueraDeCluvi} ya no están en Cluvi).`,
      })
      router.refresh()
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo conectar con Cluvi. Intenta de nuevo.' })
    } finally {
      setSincronizando(false)
    }
  }

  async function patch(id: string, cambios: Partial<EditForm> & { disponibleHoy?: boolean }) {
    const res = await fetch(`/api/menu/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cambios),
    })
    if (!res.ok) return null
    const { item } = await res.json()
    return item as MenuItemDTO
  }

  async function alternarDisponible(it: MenuItemDTO) {
    const nuevo = !it.disponibleHoy
    setItems(prev => prev.map(x => (x.id === it.id ? { ...x, disponibleHoy: nuevo } : x)))
    const ok = await patch(it.id, { disponibleHoy: nuevo })
    if (!ok) setItems(prev => prev.map(x => (x.id === it.id ? { ...x, disponibleHoy: it.disponibleHoy } : x)))
  }

  function abrirEdicion(it: MenuItemDTO) {
    setEditandoId(it.id)
    setForm({
      alergenos: it.alergenos ?? '',
      vegetariano: it.vegetariano,
      picante: it.picante,
      paraCompartir: it.paraCompartir,
      notaAgente: it.notaAgente ?? '',
    })
  }

  async function guardar(id: string) {
    if (!form) return
    setGuardando(true)
    const item = await patch(id, form)
    setGuardando(false)
    if (!item) {
      setMensaje({ tipo: 'error', texto: 'No se pudo guardar el plato. Intenta de nuevo.' })
      return
    }
    setItems(prev => prev.map(x => (x.id === id ? { ...x, ...item } : x)))
    setEditandoId(null)
    setForm(null)
  }

  let ultimoGrupo = ''

  return (
    <div className="max-w-5xl space-y-5 animate-fade-in">
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UtensilsCrossed className="w-4 h-4 text-[#ccc79f]" />
              <h1 className="text-sm font-semibold text-[#f2efe8]">Menú del restaurante</h1>
            </div>
            <p className="text-xs text-[#f2efe8]/45 max-w-xl">
              Nombres, precios y descripciones vienen de Cluvi. Acá agregás lo que Cluvi no tiene
              (alérgenos, vegetariano, picante, notas) y marcás lo que no hay hoy. Mariana consulta esta lista.
            </p>
          </div>
          <button onClick={sincronizar} disabled={sincronizando} className="btn-gold">
            <RefreshCw className={cn('w-4 h-4', sincronizando && 'animate-spin')} />
            {sincronizando ? 'Sincronizando…' : 'Sincronizar con Cluvi'}
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mt-4 text-xs text-[#f2efe8]/55">
          <span>{items.length} platos</span>
          <span>{noDisponibles} marcados como no disponibles hoy</span>
        </div>

        {mensaje && (
          <p className={cn('mt-3 text-xs', mensaje.tipo === 'ok' ? 'text-[#95be9a]' : 'text-[#cf5f56]')}>
            {mensaje.texto}
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-[#f2efe8]/70">Todavía no hay platos cargados.</p>
          <p className="text-xs text-[#f2efe8]/40 mt-1">Tocá &quot;Sincronizar con Cluvi&quot; para traer la carta.</p>
        </div>
      ) : (
        <>
          <div className="card p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#f2efe8]/35 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="input-base pl-9"
                placeholder="Buscar plato, ingrediente o subcategoría…"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoria('todas')}
                className={cn('px-3 py-1 rounded-full text-xs border transition-colors',
                  categoria === 'todas'
                    ? 'bg-[#ccc79f]/15 border-[#ccc79f]/40 text-[#ccc79f]'
                    : 'border-[#ccc79f]/15 text-[#f2efe8]/55 hover:text-[#f2efe8]')}
              >
                Todas ({items.length})
              </button>
              {categorias.map(([nombre, cantidad]) => (
                <button
                  key={nombre}
                  onClick={() => setCategoria(nombre)}
                  className={cn('px-3 py-1 rounded-full text-xs border transition-colors',
                    categoria === nombre
                      ? 'bg-[#ccc79f]/15 border-[#ccc79f]/40 text-[#ccc79f]'
                      : 'border-[#ccc79f]/15 text-[#f2efe8]/55 hover:text-[#f2efe8]')}
                >
                  {nombre} ({cantidad})
                </button>
              ))}
            </div>
          </div>

          <div className="card divide-y divide-[rgba(204,199,159,0.08)]">
            {filtrados.length === 0 && (
              <p className="p-6 text-sm text-[#f2efe8]/50 text-center">Ningún plato coincide con la búsqueda.</p>
            )}
            {filtrados.map(it => {
              const grupo = `${it.categoria} › ${it.subcategoria ?? 'General'}`
              const mostrarGrupo = grupo !== ultimoGrupo
              ultimoGrupo = grupo
              const editando = editandoId === it.id
              return (
                <div key={it.id}>
                  {mostrarGrupo && (
                    <div className="px-5 py-2 bg-[rgba(0,0,0,0.18)] text-[10px] uppercase tracking-wider text-[#ccc79f]/70">
                      {grupo}
                    </div>
                  )}
                  <div className={cn('px-5 py-3 flex items-start gap-4', !it.enCluvi && 'opacity-50')}>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-[#f2efe8]">{it.nombre}</p>
                        <span className="text-sm text-[#ccc79f]">{it.precio > 0 ? formatCOP(it.precio) : 'Sin precio'}</span>
                        {it.esNuevo && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#95be9a]/15 text-[#95be9a]">Nuevo</span>}
                        {it.vegetariano && <Leaf className="w-3.5 h-3.5 text-[#95be9a]" aria-label="Vegetariano" />}
                        {it.picante && <Flame className="w-3.5 h-3.5 text-[#cf5f56]" aria-label="Picante" />}
                        {it.paraCompartir && <Users className="w-3.5 h-3.5 text-[#ccc79f]" aria-label="Para compartir" />}
                        {!it.enCluvi && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#cf5f56]/15 text-[#cf5f56]">Ya no está en Cluvi</span>}
                        {it.agotadoCluvi && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#cf5f56]/15 text-[#cf5f56]">Agotado en Cluvi</span>}
                        {it.precio <= 0 && it.enCluvi && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f2efe8]/10 text-[#f2efe8]/55">Mariana no lo usa (sin precio)</span>}
                      </div>
                      {it.descripcion && (
                        <p className="text-xs text-[#f2efe8]/50 mt-1 line-clamp-2">{it.descripcion}</p>
                      )}
                      {(it.alergenos || it.notaAgente) && (
                        <p className="text-xs text-[#ccc79f]/75 mt-1">
                          {it.alergenos && <span>Alérgenos: {it.alergenos}. </span>}
                          {it.notaAgente && <span>Nota: {it.notaAgente}</span>}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        role="switch"
                        aria-checked={it.disponibleHoy}
                        aria-label={`Disponible hoy: ${it.nombre}`}
                        onClick={() => alternarDisponible(it)}
                        className={cn('flex items-center gap-2 text-[11px] transition-colors',
                          it.disponibleHoy ? 'text-[#95be9a]' : 'text-[#cf5f56]')}
                      >
                        <span className={cn('w-8 h-4 rounded-full relative transition-colors',
                          it.disponibleHoy ? 'bg-[#95be9a]/40' : 'bg-[#cf5f56]/40')}>
                          <span className={cn('absolute top-0.5 w-3 h-3 rounded-full bg-current transition-all',
                            it.disponibleHoy ? 'left-4' : 'left-0.5')} />
                        </span>
                        {it.disponibleHoy ? 'Hay hoy' : 'No hay hoy'}
                      </button>
                      <button
                        onClick={() => (editando ? setEditandoId(null) : abrirEdicion(it))}
                        className="btn-ghost p-1.5"
                        title={editando ? 'Cerrar' : 'Editar'}
                      >
                        {editando ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {editando && form && (
                    <div className="px-5 pb-4 space-y-3 bg-[rgba(0,0,0,0.12)]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Alérgenos / contiene</label>
                          <input
                            value={form.alergenos}
                            onChange={e => setForm(f => f && ({ ...f, alergenos: e.target.value }))}
                            className="input-base" placeholder="Ej: gluten, lácteos, mariscos"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-[#f2efe8]/45">Nota para Mariana</label>
                          <input
                            value={form.notaAgente}
                            onChange={e => setForm(f => f && ({ ...f, notaAgente: e.target.value }))}
                            className="input-base" placeholder="Ej: porción grande, ideal para 2 personas"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-5 text-xs text-[#f2efe8]/75">
                        {([
                          ['vegetariano', 'Vegetariano'],
                          ['picante', 'Picante'],
                          ['paraCompartir', 'Para compartir'],
                        ] as const).map(([campo, etiqueta]) => (
                          <label key={campo} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form[campo]}
                              onChange={e => setForm(f => f && ({ ...f, [campo]: e.target.checked }))}
                            />
                            {etiqueta}
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => guardar(it.id)} disabled={guardando} className="btn-gold">
                          {guardando ? 'Guardando…' : 'Guardar'}
                        </button>
                        <button onClick={() => setEditandoId(null)} className="btn-ghost">Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
