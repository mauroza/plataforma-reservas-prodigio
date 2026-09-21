import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/configuracion/plato-dia — leer el plato del día actual
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const actual = await prisma.dailyFeature.findUnique({ where: { id: 'actual' } })
  return NextResponse.json({ platoDia: actual })
}

// PUT /api/configuracion/plato-dia — crear o actualizar el plato del día
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { platoNombre, descripcion } = await req.json() as {
    platoNombre: string
    descripcion?: string
  }

  if (!platoNombre?.trim()) {
    return NextResponse.json({ error: 'platoNombre es requerido' }, { status: 400 })
  }

  const actual = await prisma.dailyFeature.upsert({
    where: { id: 'actual' },
    create: {
      id: 'actual',
      platoNombre: platoNombre.trim(),
      descripcion: descripcion?.trim() || null,
      updatedById: session.user.id,
    },
    update: {
      platoNombre: platoNombre.trim(),
      descripcion: descripcion?.trim() || null,
      updatedById: session.user.id,
    },
  })

  return NextResponse.json({ success: true, platoDia: actual })
}

// DELETE /api/configuracion/plato-dia — quitar el plato del día
export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await prisma.dailyFeature.deleteMany({ where: { id: 'actual' } })
  return NextResponse.json({ success: true })
}
