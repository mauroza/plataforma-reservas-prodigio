import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export interface PreOrderItem {
  producto:     string
  cantidad:     number
  observaciones?: string
}

// GET /api/reservas/:id/prepedido
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const po = await prisma.preOrder.findUnique({ where: { reservationId: params.id } })
  if (!po) return NextResponse.json({ existe: false, items: [] })

  return NextResponse.json({
    existe: true,
    id:     po.id,
    items:  JSON.parse(po.items) as PreOrderItem[],
    notas:  po.notas,
  })
}

// POST /api/reservas/:id/prepedido — crear o reemplazar
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { items, notas } = await req.json() as { items: PreOrderItem[]; notas?: string }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items es requerido (array no vacío)' }, { status: 400 })
  }

  const reserva = await prisma.reservation.findUnique({ where: { id: params.id } })
  if (!reserva) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })

  const po = await prisma.preOrder.upsert({
    where:  { reservationId: params.id },
    update: { items: JSON.stringify(items), notas: notas ?? null },
    create: { reservationId: params.id, items: JSON.stringify(items), notas: notas ?? null },
  })

  return NextResponse.json({ success: true, id: po.id })
}

// DELETE /api/reservas/:id/prepedido
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await prisma.preOrder.deleteMany({ where: { reservationId: params.id } })
  return NextResponse.json({ success: true })
}
