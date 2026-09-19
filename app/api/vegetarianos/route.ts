import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/vegetarianos — listar todos
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const opciones = await prisma.vegetarianOption.findMany({
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ opciones })
}

// POST /api/vegetarianos — agregar opción vegetariana
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { nombre, notas } = await req.json() as {
    nombre: string
    notas?: string
  }

  if (!nombre?.trim()) {
    return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 })
  }

  const opcion = await prisma.vegetarianOption.create({
    data: {
      nombre: nombre.trim(),
      notas: notas?.trim() || null,
    },
  })

  return NextResponse.json({ success: true, opcion }, { status: 201 })
}
