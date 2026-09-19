import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/configuracion/plato-semana — leer el plato/recomendación de la semana actual
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const actual = await prisma.weeklyFeature.findUnique({ where: { id: 'actual' } })
  return NextResponse.json({ platoSemana: actual })
}

// PUT /api/configuracion/plato-semana — crear o actualizar el plato de la semana
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

  const actual = await prisma.weeklyFeature.upsert({
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

  return NextResponse.json({ success: true, platoSemana: actual })
}

// DELETE /api/configuracion/plato-semana — quitar la recomendación de la semana
export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await prisma.weeklyFeature.deleteMany({ where: { id: 'actual' } })
  return NextResponse.json({ success: true })
}
