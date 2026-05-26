import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/dias-especiales — listar todos
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const dias = await prisma.specialDay.findMany({
    orderBy: { fecha: 'asc' },
  })

  return NextResponse.json({ dias })
}

// POST /api/dias-especiales — crear día especial
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { nombre, fecha, tipo, notas } = await req.json() as {
    nombre: string
    fecha:  string  // YYYY-MM-DD
    tipo?:  string
    notas?: string
  }

  if (!nombre || !fecha) {
    return NextResponse.json({ error: 'nombre y fecha son requeridos' }, { status: 400 })
  }

  const dia = await prisma.specialDay.create({
    data: {
      nombre,
      fecha:  new Date(`${fecha}T00:00:00-05:00`),
      tipo:   tipo ?? 'solo_manual',
      notas:  notas ?? null,
    },
  })

  return NextResponse.json({ success: true, dia }, { status: 201 })
}
