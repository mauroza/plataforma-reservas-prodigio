import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// DELETE /api/mesas/bloques/:id — eliminar bloqueo
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const bloque = await prisma.tableBlock.findUnique({ where: { id: params.id } })
  if (!bloque) return NextResponse.json({ error: 'Bloque no encontrado' }, { status: 404 })

  await prisma.tableBlock.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
