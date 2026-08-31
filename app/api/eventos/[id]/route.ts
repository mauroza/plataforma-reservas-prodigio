import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PATCH /api/eventos/:id — confirmar/cancelar/finalizar desde el panel
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json() as {
    estado?: 'pendiente' | 'confirmado' | 'cancelado' | 'finalizado'
    estadoPago?: string
    montoTotal?: number
    montoAbono?: number
    notas?: string
  }

  const evento = await prisma.event.findUnique({ where: { id: params.id } })
  if (!evento) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  const data: Record<string, unknown> = {}
  if (body.estado)     data.estado     = body.estado
  if (body.estadoPago) data.estadoPago = body.estadoPago
  if (body.montoTotal !== undefined) data.montoTotal = body.montoTotal
  if (body.montoAbono !== undefined) data.montoAbono = body.montoAbono
  if (body.notas !== undefined) data.notas = body.notas

  const actualizado = await prisma.event.update({ where: { id: params.id }, data })

  return NextResponse.json({ success: true, evento: actualizado })
}
