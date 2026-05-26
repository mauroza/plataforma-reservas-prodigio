import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarRange, Zap } from 'lucide-react'
import { StatsCards }        from '@/components/dashboard/stats-cards'
import { ReservationsToday } from '@/components/dashboard/reservations-today'
import { TableOverview }     from '@/components/dashboard/table-overview'
import { prisma }            from '@/lib/db'
import type { Reserva, Mesa, Evento } from '@/types'
import { formatDateShort, getEventStatusStyle, getEventStatusLabel, cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const ahora  = new Date()
  const hoy0   = new Date(ahora.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }) + 'T00:00:00-05:00')
  const hoy23  = new Date(ahora.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }) + 'T23:59:59-05:00')
  const hace30 = new Date(ahora.getTime() - 30 * 24 * 60 * 60_000)
  const sem7   = new Date(ahora.getTime() +  7 * 24 * 60 * 60_000)

  const [
    reservasHoyRows,
    todasTablas,
    reservasActivasHoy,
    eventosSemanaRows,
    aiStats,
  ] = await Promise.all([
    // Reservas de hoy
    prisma.reservation.findMany({
      where: { fechaInicio: { gte: hoy0, lte: hoy23 } },
      orderBy: { fechaInicio: 'asc' },
      include: { tables: { include: { table: { select: { nombre: true } } } } },
    }),
    // Todas las mesas
    prisma.table.findMany({ orderBy: [{ zona: 'asc' }, { nombre: 'asc' }] }),
    // Reservas activas hoy (para estado de mesas)
    prisma.reservation.findMany({
      where: {
        estado: { in: ['confirmada', 'pendiente'] },
        fechaInicio: { lte: hoy23 },
        fechaFin:    { gte: hoy0  },
      },
      include: { tables: { include: { table: { select: { id: true } } } } },
    }),
    // Eventos próximos (esta semana)
    prisma.event.findMany({
      where: { fechaInicio: { gte: ahora, lte: sem7 }, estado: { notIn: ['cancelado'] } },
      orderBy: { fechaInicio: 'asc' },
      take: 3,
    }),
    // Métricas IA últimos 30 días
    Promise.all([
      prisma.reservation.count({ where: { fuente: 'ia_whatsapp', createdAt: { gte: hace30 } } }),
      prisma.reservation.count({ where: { createdAt: { gte: hace30 } } }),
      prisma.reservation.count({ where: { estado: 'cancelada', createdAt: { gte: hace30 } } }),
      prisma.event.count({ where: { createdAt: { gte: hace30 } } }),
    ]),
  ])

  // ── Calcular estado de mesas ─────────────────────────────────────────────
  const ahora_ts = ahora.getTime()
  const mesaOcupada   = new Map<string, typeof reservasActivasHoy[0]>()
  const mesaReservada = new Map<string, typeof reservasActivasHoy[0]>()

  for (const r of reservasActivasHoy) {
    const esAhora = r.fechaInicio.getTime() <= ahora_ts && r.fechaFin.getTime() >= ahora_ts
    for (const rt of r.tables) {
      if (esAhora) mesaOcupada.set(rt.table.id, r)
      else         mesaReservada.set(rt.table.id, r)
    }
  }

  const mesas: Mesa[] = todasTablas.map(t => {
    const ocup = mesaOcupada.get(t.id)
    const resv = mesaReservada.get(t.id)
    const act  = ocup ?? resv
    return {
      id: t.id, nombre: t.nombre, capacidad: t.capacidad,
      zona: t.zona as Mesa['zona'], tipo: t.tipo as Mesa['tipo'],
      activa: t.activa, reservable: t.reservable,
      estado: ocup ? 'ocupada' : resv ? 'reservada' : 'disponible',
      reservaActual: act ? {
        id: act.id, nombreCliente: act.nombreCliente,
        personas: act.personas,
        inicio: act.fechaInicio.toISOString(),
        fin:    act.fechaFin.toISOString(),
      } : undefined,
    }
  })

  // ── Mapear reservas hoy ──────────────────────────────────────────────────
  const reservasHoy: Reserva[] = reservasHoyRows.map(r => ({
    id: r.id, nombreCliente: r.nombreCliente, telefono: r.telefono,
    personas: r.personas,
    fechaInicio: r.fechaInicio.toISOString(), fechaFin: r.fechaFin.toISOString(),
    estado: r.estado as Reserva['estado'], zona: r.zona as Reserva['zona'],
    mesas: r.tables.map(t => t.table.nombre),
    ocasionEspecial: r.ocasionEspecial ?? undefined,
    estadoPago: r.estadoPago as Reserva['estadoPago'],
    notas: r.notas ?? undefined, fuente: r.fuente as Reserva['fuente'],
    creadaEn: r.createdAt.toISOString(),
  }))

  const eventos: Evento[] = eventosSemanaRows.map(e => ({
    id: e.id, nombre: e.nombre, empresaPersona: e.empresaPersona,
    personas: e.personas,
    fechaInicio: e.fechaInicio.toISOString(), fechaFin: e.fechaFin.toISOString(),
    tipoEvento: e.tipoEvento, opcionMenu: e.opcionMenu as Evento['opcionMenu'],
    estadoPago: e.estadoPago as Evento['estadoPago'],
    montoTotal: e.montoTotal ?? undefined, montoAbono: e.montoAbono ?? undefined,
    necesidadesEspeciales: e.necesidadesEspeciales ?? undefined,
    notas: e.notas ?? undefined, estado: e.estado as Evento['estado'],
    creadaEn: e.createdAt.toISOString(),
  }))

  // ── Stats ────────────────────────────────────────────────────────────────
  const [iaReservas, totalReservas, canceladas, totalEventos] = aiStats
  const mesasOcupadas = mesas.filter(m => m.estado === 'ocupada').length
  const confirmadas   = reservasHoy.filter(r => r.estado === 'confirmada').length
  const personasHoy   = reservasHoy.reduce((s, r) => s + r.personas, 0)
  const totalMesas    = mesas.filter(m => m.reservable).length
  const capacidadMax  = mesas.filter(m => m.reservable).reduce((s, m) => s + m.capacidad, 0)
  const tasaConv      = totalReservas > 0 ? Math.round((iaReservas / totalReservas) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <StatsCards
        reservasHoy={reservasHoy.length}
        confirmadas={confirmadas}
        mesasOcupadas={mesasOcupadas}
        totalMesas={totalMesas}
        personasHoy={personasHoy}
        capacidadMax={capacidadMax}
        eventosSemana={eventos.length}
        proximoEvento={eventos[0] ? formatDateShort(eventos[0].fechaInicio) : ''}
      />

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Reservas hoy */}
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#f2efe8]">
              Reservas de Hoy
              <span className="ml-2 text-xs font-normal text-[#f2efe8]/35">({reservasHoy.length})</span>
            </h2>
            <Link href="/reservas" className="text-xs text-[#ccc79f]/70 hover:text-[#ccc79f] flex items-center gap-1 transition-colors">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <ReservationsToday reservas={reservasHoy} />
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Table map */}
          <TableOverview mesas={mesas} />

          {/* Próximos eventos */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#f2efe8]">Próximos Eventos</h2>
              <Link href="/eventos" className="text-xs text-[#ccc79f]/70 hover:text-[#ccc79f] flex items-center gap-1 transition-colors">
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {eventos.length === 0 ? (
              <p className="text-xs text-[#f2efe8]/30 text-center py-4">Sin eventos esta semana</p>
            ) : (
              <div className="space-y-3">
                {eventos.map(ev => (
                  <div
                    key={ev.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[rgba(0,0,0,0.2)] border"
                    style={{ borderColor: 'rgba(204,199,159,0.07)' }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#2d2d32]/30 flex items-center justify-center shrink-0">
                      <CalendarRange className="w-4 h-4 text-[#95be9a]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#f2efe8] truncate">{ev.nombre}</p>
                      <p className="text-[10px] text-[#f2efe8]/40 mt-0.5">
                        {formatDateShort(ev.fechaInicio)} · {ev.personas} personas
                      </p>
                      <span className={cn('badge mt-1.5 text-[10px] px-1.5 py-px', getEventStatusStyle(ev.estado))}>
                        {getEventStatusLabel(ev.estado)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* IA metrics */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded bg-[#ccc79f]/15 flex items-center justify-center">
                <Zap className="w-3 h-3 text-[#ccc79f]" />
              </div>
              <h2 className="text-sm font-semibold text-[#f2efe8]">Agente IA · 30 días</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Reservas bot',     value: iaReservas     },
                { label: 'Total reservas',   value: totalReservas  },
                { label: 'Cancelaciones',    value: canceladas     },
                { label: 'Conversión',       value: `${tasaConv}%` },
              ].map(m => (
                <div key={m.label} className="rounded-xl bg-[rgba(0,0,0,0.2)] p-3 border" style={{ borderColor: 'rgba(204,199,159,0.07)' }}>
                  <p className="text-lg font-semibold text-[#ccc79f]">{m.value}</p>
                  <p className="text-[10px] text-[#f2efe8]/40 mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
