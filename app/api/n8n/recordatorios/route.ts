import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function auth(req: Request) {
  return req.headers.get('x-api-key') === process.env.N8N_API_KEY
}

// GET /api/n8n/recordatorios?tipo=24h|2h
// Devuelve reservas que necesitan recordatorio y marca el flag para evitar duplicados
export async function GET(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get('tipo') // "24h" | "2h"

  if (tipo !== '24h' && tipo !== '2h') {
    return NextResponse.json({ error: 'Parámetro tipo requerido: 24h | 2h' }, { status: 400 })
  }

  const ahora = new Date()
  // Ventana de tiempo: busca reservas cuyo inicio esté entre [ahora + offset - 30min, ahora + offset + 30min]
  const offset = tipo === '24h' ? 24 * 60 : 2 * 60  // minutos
  const ventanaInicio = new Date(ahora.getTime() + (offset - 30) * 60_000)
  const ventanaFin    = new Date(ahora.getTime() + (offset + 30) * 60_000)

  const campo = tipo === '24h' ? 'reminderSent24h' : 'reminderSent2h'

  const reservas = await prisma.reservation.findMany({
    where: {
      estado: { in: ['confirmada', 'pendiente'] },
      fechaInicio: { gte: ventanaInicio, lte: ventanaFin },
      [campo]: false,
    },
    include: {
      tables: { include: { table: { select: { nombre: true } } } },
    },
    orderBy: { fechaInicio: 'asc' },
  })

  if (reservas.length === 0) {
    return NextResponse.json({ total: 0, recordatorios: [] })
  }

  // Marcar como enviados para no repetirlos
  await prisma.reservation.updateMany({
    where: { id: { in: reservas.map(r => r.id) } },
    data:  { [campo]: true },
  })

  return NextResponse.json({
    total: reservas.length,
    tipo,
    recordatorios: reservas.map(r => ({
      id:       r.id,
      cliente:  r.nombreCliente,
      telefono: r.telefono,
      personas: r.personas,
      fecha:    r.fechaInicio.toLocaleDateString('es-CO', { timeZone: 'America/Bogota', weekday: 'long', day: 'numeric', month: 'long' }),
      hora:     r.fechaInicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' }),
      zona:     r.zona,
      mesas:    r.tables.map(t => t.table.nombre),
      mensaje:  tipo === '24h'
        ? `Hola ${r.nombreCliente.split(' ')[0]} 😊 Te recordamos tu reserva mañana en Prodigio Gastro Bar a las ${r.fechaInicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })} para ${r.personas} personas. ¡Te esperamos! 🍽️`
        : `Hola ${r.nombreCliente.split(' ')[0]} 😊 Tu reserva en Prodigio Gastro Bar es en aproximadamente 2 horas (${r.fechaInicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })}). ¡Nos vemos pronto! 🙌`,
    })),
  })
}
