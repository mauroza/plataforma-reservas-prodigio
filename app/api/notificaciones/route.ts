import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const ahora  = new Date()
  const hace24 = new Date(ahora.getTime() - 24 * 60 * 60_000)
  const hoy0   = new Date(ahora.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }) + 'T00:00:00-05:00')
  const hoy23  = new Date(ahora.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }) + 'T23:59:59-05:00')

  const [pendientes, recientes, eventosProximos] = await Promise.all([
    // Reservas de hoy pendientes de confirmación
    prisma.reservation.findMany({
      where: {
        estado: 'pendiente',
        fechaInicio: { gte: hoy0, lte: hoy23 },
      },
      select: { id: true, nombreCliente: true, personas: true, fechaInicio: true, createdAt: true },
      orderBy: { fechaInicio: 'asc' },
    }),

    // Reservas creadas en las últimas 24h por el bot (ia_whatsapp)
    prisma.reservation.findMany({
      where: {
        fuente: 'ia_whatsapp',
        createdAt: { gte: hace24 },
        estado: { notIn: ['cancelada'] },
      },
      select: { id: true, nombreCliente: true, personas: true, fechaInicio: true, createdAt: true, estado: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),

    // Eventos próximos (próximas 48h)
    prisma.event.findMany({
      where: {
        estado: { in: ['pendiente', 'confirmado'] },
        fechaInicio: { gte: ahora, lte: new Date(ahora.getTime() + 48 * 60 * 60_000) },
      },
      select: { id: true, nombre: true, empresaPersona: true, personas: true, fechaInicio: true, estado: true },
      orderBy: { fechaInicio: 'asc' },
      take: 5,
    }),
  ])

  type Notif = {
    id: string
    type: 'reserva' | 'evento' | 'alerta'
    title: string
    body: string
    time: string
    read: boolean
  }

  const notifs: Notif[] = []

  // Alertas: reservas pendientes de hoy
  if (pendientes.length > 0) {
    notifs.push({
      id: 'alerta-pendientes',
      type: 'alerta',
      title: pendientes.length === 1 ? '1 reserva sin confirmar' : `${pendientes.length} reservas sin confirmar`,
      body: `Hoy: ${pendientes.map(r => r.nombreCliente.split(' ')[0]).join(', ')}`,
      time: 'hoy',
      read: false,
    })
  }

  // Reservas recientes del bot
  for (const r of recientes.slice(0, 5)) {
    const horaStr = r.fechaInicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })
    const diffMin = Math.round((ahora.getTime() - r.createdAt.getTime()) / 60_000)
    const timeAgo = diffMin < 60
      ? `hace ${diffMin} min`
      : `hace ${Math.round(diffMin / 60)} h`
    notifs.push({
      id: `reserva-${r.id}`,
      type: 'reserva',
      title: r.estado === 'pendiente' ? 'Nueva reserva (bot)' : 'Reserva confirmada',
      body: `${r.nombreCliente} · ${horaStr} · ${r.personas} personas`,
      time: timeAgo,
      read: false,
    })
  }

  // Eventos próximos
  for (const e of eventosProximos) {
    const horaStr = e.fechaInicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })
    const esHoy = e.fechaInicio >= hoy0 && e.fechaInicio <= hoy23
    notifs.push({
      id: `evento-${e.id}`,
      type: 'evento',
      title: esHoy ? 'Evento hoy' : 'Evento mañana',
      body: `${e.empresaPersona} · ${horaStr} · ${e.personas} personas`,
      time: esHoy ? 'hoy' : 'mañana',
      read: e.estado === 'confirmado',
    })
  }

  return NextResponse.json({ notificaciones: notifs })
}
