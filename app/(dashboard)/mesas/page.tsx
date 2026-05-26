import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { MesasView } from '@/components/mesas/mesas-view'
import type { Mesa } from '@/types'

export const metadata: Metadata = { title: 'Mesas' }
export const dynamic = 'force-dynamic'

export default async function MesasPage() {
  const ahora = new Date()
  const hoy0  = new Date(ahora.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }) + 'T00:00:00-05:00')
  const hoy23 = new Date(ahora.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }) + 'T23:59:59-05:00')

  const [tablas, reservasActivas, bloquesActivos] = await Promise.all([
    prisma.table.findMany({ orderBy: [{ zona: 'asc' }, { nombre: 'asc' }] }),
    prisma.reservation.findMany({
      where: {
        estado: { in: ['confirmada', 'pendiente'] },
        fechaInicio: { lte: hoy23 },
        fechaFin:    { gte: hoy0  },
      },
      include: { tables: { include: { table: { select: { id: true } } } } },
    }),
    prisma.tableBlock.findMany({
      where: { inicio: { lte: ahora }, fin: { gte: ahora } },
      select: { tableId: true, id: true, motivo: true, fin: true },
    }),
  ])

  const ahora_ts = ahora.getTime()
  const mesaOcupada   = new Map<string, typeof reservasActivas[0]>()
  const mesaReservada = new Map<string, typeof reservasActivas[0]>()
  const mesaBloqueada = new Set(bloquesActivos.map(b => b.tableId))

  for (const r of reservasActivas) {
    const esAhora = r.fechaInicio.getTime() <= ahora_ts && r.fechaFin.getTime() >= ahora_ts
    for (const rt of r.tables) {
      if (esAhora) mesaOcupada.set(rt.table.id, r)
      else         mesaReservada.set(rt.table.id, r)
    }
  }

  const mesas: Mesa[] = tablas.map(t => {
    const ocup = mesaOcupada.get(t.id)
    const resv = mesaReservada.get(t.id)
    const bloq = mesaBloqueada.has(t.id)
    const act  = ocup ?? resv
    return {
      id:         t.id,
      nombre:     t.nombre,
      capacidad:  t.capacidad,
      zona:       t.zona as Mesa['zona'],
      tipo:       t.tipo as Mesa['tipo'],
      activa:     t.activa,
      reservable: t.reservable,
      estado:     bloq ? 'bloqueada' : ocup ? 'ocupada' : resv ? 'reservada' : 'disponible',
      reservaActual: act ? {
        id:            act.id,
        nombreCliente: act.nombreCliente,
        personas:      act.personas,
        inicio:        act.fechaInicio.toISOString(),
        fin:           act.fechaFin.toISOString(),
      } : undefined,
    }
  })

  return <MesasView initialMesas={mesas} />
}
