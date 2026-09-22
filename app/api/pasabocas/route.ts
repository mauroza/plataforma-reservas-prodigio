import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/pasabocas — listar todos
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const pasabocas = await prisma.pasaboca.findMany({
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ pasabocas })
}

// POST /api/pasabocas — agregar pasabocas
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { nombre, descripcion, precio } = await req.json() as {
    nombre: string
    descripcion?: string
    precio: number
  }

  if (!nombre?.trim()) {
    return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 })
  }
  if (!precio || precio <= 0) {
    return NextResponse.json({ error: 'precio es requerido' }, { status: 400 })
  }

  const pasaboca = await prisma.pasaboca.create({
    data: {
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      precio,
      updatedById: session.user.id,
    },
  })

  return NextResponse.json({ success: true, pasaboca }, { status: 201 })
}
