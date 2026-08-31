import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function auth(req: Request) {
  return req.headers.get('x-api-key') === process.env.N8N_API_KEY
}

// GET /api/n8n/noshow
// Política del cliente (Respuestas Software.docx, sección 9):
//   - A los 10 min de retraso: se manda un mensaje preguntando si viene en camino.
//   - Si no responde en 5 min más (15 min de retraso total): se libera la mesa.
// Esta ruta devuelve dos listas separadas para que n8n las procese en un solo llamado:
//   - noShows: reservas que ACABAN de cruzar los 10 min → mandar el mensaje "¿vienes en camino?"
//   - liberar: reservas que YA recibieron ese mensaje y llevan 15+ min de retraso sin resolverse
//              → n8n debe hacer PATCH acá mismo (accion:"liberar") para marcarlas no_asistio
export async function GET(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const ahora   = new Date()
  const hace10  = new Date(ahora.getTime() - 10 * 60_000)
  const hace15  = new Date(ahora.getTime() - 15 * 60_000)

  // Reservas que iniciaron entre hace 15 y hace 10 min, aún activas, mensaje no enviado
  const candidatos = await prisma.reservation.findMany({
    where: {
      estado:        { in: ['confirmada', 'pendiente'] },
      fechaInicio:   { gte: hace15, lte: hace10 },
      noShowMsgSent: false,
    },
    include: {
      tables: { include: { table: { select: { nombre: true } } } },
    },
  })

  if (candidatos.length > 0) {
    await prisma.reservation.updateMany({
      where: { id: { in: candidatos.map(r => r.id) } },
      data:  { noShowMsgSent: true },
    })
  }

  // Reservas que ya recibieron el mensaje de los 10 min y llevan 15+ min de retraso —
  // nadie las confirmó ni canceló, toca liberar la mesa.
  const paraLiberar = await prisma.reservation.findMany({
    where: {
      estado:        { in: ['confirmada', 'pendiente'] },
      fechaInicio:   { lte: hace15 },
      noShowMsgSent: true,
    },
    include: {
      tables: { include: { table: { select: { nombre: true } } } },
    },
  })

  return NextResponse.json({
    total: candidatos.length,
    noShows: candidatos.map(r => ({
      id:       r.id,
      cliente:  r.nombreCliente,
      telefono: r.telefono,
      personas: r.personas,
      hora:     r.fechaInicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' }),
      mesas:    r.tables.map(t => t.table.nombre),
      mensaje:  `Hola ${r.nombreCliente.split(' ')[0]}, teníamos una reserva para ${r.personas} personas a las ${r.fechaInicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })} en Prodigio. ¿Estás en camino? 🙏`,
    })),
    totalLiberar: paraLiberar.length,
    liberar: paraLiberar.map(r => ({
      id:       r.id,
      cliente:  r.nombreCliente,
      telefono: r.telefono,
      personas: r.personas,
      hora:     r.fechaInicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' }),
      mesas:    r.tables.map(t => t.table.nombre),
      mensaje:  `Hola ${r.nombreCliente.split(' ')[0]}, como no tuvimos respuesta liberamos tu mesa en Prodigio. Si aún quieres venir, escríbenos y con gusto te ayudamos a reagendar. 🙏`,
    })),
  })
}

// PATCH /api/n8n/noshow — marcar reserva como no_asistio
export async function PATCH(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { reservationId } = await req.json() as { reservationId: string }
  if (!reservationId) return NextResponse.json({ error: 'reservationId requerido' }, { status: 400 })

  const reserva = await prisma.reservation.update({
    where: { id: reservationId },
    data:  { estado: 'no_asistio' },
  })

  return NextResponse.json({
    success: true,
    mensaje: `Reserva de ${reserva.nombreCliente} marcada como no asistió.`,
  })
}
