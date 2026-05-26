import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// DELETE /api/dias-especiales/:id
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await prisma.specialDay.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}

// PATCH /api/dias-especiales/:id
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { nombre, fecha, tipo, notas } = await req.json() as {
    nombre?: string; fecha?: string; tipo?: string; notas?: string
  }

  const data: Record<string, unknown> = {}
  if (nombre) data.nombre = nombre
  if (fecha)  data.fecha  = new Date(`${fecha}T00:00:00-05:00`)
  if (tipo)   data.tipo   = tipo
  if (notas !== undefined) data.notas = notas

  const dia = await prisma.specialDay.update({ where: { id: params.id }, data })
  return NextResponse.json({ success: true, dia })
}
