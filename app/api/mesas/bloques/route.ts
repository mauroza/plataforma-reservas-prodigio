import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/mesas/bloques?tableId=xxx  — bloques activos de una mesa
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tableId = searchParams.get('tableId')
  const ahora   = new Date()

  const where = tableId
    ? { tableId, fin: { gte: ahora } }
    : { fin: { gte: ahora } }

  const bloques = await prisma.tableBlock.findMany({
    where,
    include: { table: { select: { nombre: true } } },
    orderBy: { inicio: 'asc' },
  })

  return NextResponse.json({ bloques })
}

// POST /api/mesas/bloques — crear bloqueo
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { tableId, inicio, fin, motivo } = await req.json() as {
    tableId: string
    inicio: string   // ISO
    fin: string      // ISO
    motivo?: string
  }

  if (!tableId || !inicio || !fin) {
    return NextResponse.json({ error: 'tableId, inicio y fin son requeridos' }, { status: 400 })
  }

  const mesa = await prisma.table.findUnique({ where: { id: tableId } })
  if (!mesa) return NextResponse.json({ error: 'Mesa no encontrada' }, { status: 404 })

  const bloque = await prisma.tableBlock.create({
    data: {
      tableId,
      inicio: new Date(inicio),
      fin:    new Date(fin),
      motivo: motivo ?? null,
    },
  })

  return NextResponse.json({ success: true, bloque }, { status: 201 })
}
