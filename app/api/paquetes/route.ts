import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/paquetes — listar catálogo
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const paquetes = await prisma.package.findMany({
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ paquetes })
}

// POST /api/paquetes — crear paquete
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { nombre, descripcion, costo } = await req.json() as {
    nombre: string
    descripcion?: string
    costo: number
  }

  if (!nombre || costo === undefined || costo === null) {
    return NextResponse.json({ error: 'nombre y costo son requeridos' }, { status: 400 })
  }

  const paquete = await prisma.package.create({
    data: {
      nombre,
      descripcion: descripcion ?? null,
      costo: Number(costo),
    },
  })

  return NextResponse.json({ success: true, paquete }, { status: 201 })
}
