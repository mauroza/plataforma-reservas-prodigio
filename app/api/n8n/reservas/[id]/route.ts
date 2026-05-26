import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function auth(req: Request) {
  return req.headers.get('x-api-key') === process.env.N8N_API_KEY
}

// PATCH /api/n8n/reservas/:id  — confirmar o cancelar
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!auth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { estado, notas } = await req.json() as {
    estado: 'confirmada' | 'cancelada' | 'finalizada' | 'no_asistio'
    notas?: string
  }

  const validos = ['confirmada', 'cancelada', 'finalizada', 'no_asistio']
  if (!validos.includes(estado)) {
    return NextResponse.json({
      error: `Estado inválido. Valores permitidos: ${validos.join(', ')}`,
    }, { status: 400 })
  }

  const reserva = await prisma.reservation.findUnique({ where: { id: params.id } })
  if (!reserva) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })

  const actualizada = await prisma.reservation.update({
    where: { id: params.id },
    data: {
      estado,
      ...(notas ? { notas } : {}),
    },
    include: {
      tables: { include: { table: { select: { nombre: true } } } },
    },
  })

  return NextResponse.json({
    success: true,
    reserva: {
      id: actualizada.id,
      cliente: actualizada.nombreCliente,
      estado: actualizada.estado,
      mesa: actualizada.tables[0]?.table.nombre,
    },
    mensaje: `Reserva de ${actualizada.nombreCliente} actualizada a "${estado}".`,
  })
}

// GET /api/n8n/reservas/:id  — consultar una reserva por ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!auth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const reserva = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: {
      tables: { include: { table: { select: { nombre: true, zona: true } } } },
    },
  })

  if (!reserva) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })

  return NextResponse.json({
    id: reserva.id,
    cliente: reserva.nombreCliente,
    telefono: reserva.telefono,
    personas: reserva.personas,
    fecha: reserva.fechaInicio.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }),
    hora: reserva.fechaInicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' }),
    horaFin: reserva.fechaFin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' }),
    estado: reserva.estado,
    zona: reserva.zona,
    mesas: reserva.tables.map(t => t.table.nombre),
    ocasionEspecial: reserva.ocasionEspecial,
    notas: reserva.notas,
  })
}
