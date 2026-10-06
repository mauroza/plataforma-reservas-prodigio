import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/menu — carta completa (dashboard)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const items = await prisma.menuItem.findMany({ orderBy: [{ orden: 'asc' }, { nombre: 'asc' }] })
  return NextResponse.json({ items })
}
