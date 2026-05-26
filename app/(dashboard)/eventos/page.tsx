import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { EventosView } from '@/components/eventos/eventos-view'
import type { Evento } from '@/types'

export const metadata: Metadata = { title: 'Eventos' }
export const dynamic = 'force-dynamic'

export default async function EventosPage() {
  const rows = await prisma.event.findMany({
    orderBy: { fechaInicio: 'desc' },
  })

  const eventos: Evento[] = rows.map(e => ({
    id:                    e.id,
    nombre:                e.nombre,
    empresaPersona:        e.empresaPersona,
    personas:              e.personas,
    fechaInicio:           e.fechaInicio.toISOString(),
    fechaFin:              e.fechaFin.toISOString(),
    tipoEvento:            e.tipoEvento,
    opcionMenu:            e.opcionMenu as Evento['opcionMenu'],
    estadoPago:            e.estadoPago as Evento['estadoPago'],
    montoTotal:            e.montoTotal ?? undefined,
    montoAbono:            e.montoAbono ?? undefined,
    necesidadesEspeciales: e.necesidadesEspeciales ?? undefined,
    notas:                 e.notas ?? undefined,
    estado:                e.estado as Evento['estado'],
    creadaEn:              e.createdAt.toISOString(),
  }))

  return <EventosView initialEventos={eventos} />
}
