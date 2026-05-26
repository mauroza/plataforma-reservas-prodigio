import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PATCH /api/reservas/:id — actualizar estado o pago desde el panel
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json() as {
    estado?: string
    estadoPago?: string
    notas?: string
    mesas?: string[]  // nombres de mesas para reasignar
  }

  const reserva = await prisma.reservation.findUnique({ where: { id: params.id } })
  if (!reserva) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })

  const data: Record<string, unknown> = { updatedById: session.user.id }
  if (body.estado)     data.estado     = body.estado
  if (body.estadoPago) data.estadoPago = body.estadoPago
  if (body.notas !== undefined) data.notas = body.notas

  // Reasignación de mesas
  if (body.mesas && body.mesas.length > 0) {
    const tablas = await prisma.table.findMany({ where: { nombre: { in: body.mesas } } })
    if (tablas.length !== body.mesas.length) {
      return NextResponse.json({ error: 'Una o más mesas no encontradas' }, { status: 400 })
    }
    await prisma.reservationTable.deleteMany({ where: { reservationId: params.id } })
    await prisma.reservationTable.createMany({
      data: tablas.map(t => ({ reservationId: params.id, tableId: t.id })),
    })
  }

  const actualizada = await prisma.reservation.update({
    where: { id: params.id },
    data,
    include: { tables: { include: { table: { select: { nombre: true } } } } },
  })

  return NextResponse.json({ success: true, reserva: actualizada })
}

// GET /api/reservas/:id — detalle completo
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const reserva = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: {
      tables:   { include: { table: { select: { nombre: true, zona: true } } } },
      preOrder: true,
    },
  })
  if (!reserva) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json(reserva)
}
