import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface Body {
  alergenos?: string | null
  vegetariano?: boolean
  picante?: boolean
  paraCompartir?: boolean
  notaAgente?: string | null
  disponibleHoy?: boolean
}

// PATCH /api/menu/:id — edita SOLO los campos propios del dashboard
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const b = (await req.json()) as Body
  const data: Record<string, unknown> = {}
  if (b.alergenos !== undefined) data.alergenos = b.alergenos?.trim() || null
  if (b.notaAgente !== undefined) data.notaAgente = b.notaAgente?.trim() || null
  if (typeof b.vegetariano === 'boolean') data.vegetariano = b.vegetariano
  if (typeof b.picante === 'boolean') data.picante = b.picante
  if (typeof b.paraCompartir === 'boolean') data.paraCompartir = b.paraCompartir
  if (typeof b.disponibleHoy === 'boolean') data.disponibleHoy = b.disponibleHoy

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })
  }

  const existe = await prisma.menuItem.findUnique({ where: { id: params.id }, select: { id: true } })
  if (!existe) return NextResponse.json({ error: 'Plato no encontrado' }, { status: 404 })

  const item = await prisma.menuItem.update({ where: { id: params.id }, data })
  return NextResponse.json({ success: true, item })
}
