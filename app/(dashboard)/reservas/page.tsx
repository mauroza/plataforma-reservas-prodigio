import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { ReservasView } from '@/components/reservas/reservas-view'
import type { Reserva } from '@/types'

export const metadata: Metadata = { title: 'Reservaciones' }
export const dynamic = 'force-dynamic'

export default async function ReservasPage() {
  const rows = await prisma.reservation.findMany({
    orderBy: { fechaInicio: 'desc' },
    include: { tables: { include: { table: { select: { nombre: true } } } } },
  })

  const reservas: Reserva[] = rows.map(r => ({
    id:              r.id,
    nombreCliente:   r.nombreCliente,
    telefono:        r.telefono,
    personas:        r.personas,
    fechaInicio:     r.fechaInicio.toISOString(),
    fechaFin:        r.fechaFin.toISOString(),
    estado:          r.estado as Reserva['estado'],
    zona:            r.zona as Reserva['zona'],
    mesas:           r.tables.map(t => t.table.nombre),
    ocasionEspecial: r.ocasionEspecial ?? undefined,
    estadoPago:      r.estadoPago as Reserva['estadoPago'],
    notas:           r.notas ?? undefined,
    fuente:          r.fuente as Reserva['fuente'],
    creadaEn:        r.createdAt.toISOString(),
  }))

  return <ReservasView initialReservas={reservas} />
}
