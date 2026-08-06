import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PATCH /api/paquetes/:id — editar o activar/desactivar
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { nombre, descripcion, costo, activo } = await req.json() as {
    nombre?: string; descripcion?: string; costo?: number; activo?: boolean
  }

  const data: Record<string, unknown> = {}
  if (nombre !== undefined)      data.nombre      = nombre
  if (descripcion !== undefined) data.descripcion = descripcion
  if (costo !== undefined)       data.costo       = Number(costo)
  if (activo !== undefined)      data.activo      = activo

  const paquete = await prisma.package.update({ where: { id: params.id }, data })
  return NextResponse.json({ success: true, paquete })
}

// DELETE /api/paquetes/:id
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const ventas = await prisma.packageSale.count({ where: { packageId: params.id } })
  if (ventas > 0) {
    // Tiene historial de ventas — no se borra, se desactiva para no perder el consolidado.
    const paquete = await prisma.package.update({ where: { id: params.id }, data: { activo: false } })
    return NextResponse.json({ success: true, desactivado: true, paquete })
  }

  await prisma.package.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true, desactivado: false })
}
