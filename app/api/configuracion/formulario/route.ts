import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/configuracion/formulario — leer el link del formulario actual
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const actual = await prisma.closingForm.findUnique({ where: { id: 'actual' } })
  return NextResponse.json({ formulario: actual })
}

// PUT /api/configuracion/formulario — crear o actualizar el link
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { url, descripcion } = await req.json() as {
    url: string
    descripcion?: string
  }

  if (!url?.trim()) {
    return NextResponse.json({ error: 'url es requerida' }, { status: 400 })
  }

  const actual = await prisma.closingForm.upsert({
    where: { id: 'actual' },
    create: {
      id: 'actual',
      url: url.trim(),
      descripcion: descripcion?.trim() || null,
      updatedById: session.user.id,
    },
    update: {
      url: url.trim(),
      descripcion: descripcion?.trim() || null,
      updatedById: session.user.id,
    },
  })

  return NextResponse.json({ success: true, formulario: actual })
}
