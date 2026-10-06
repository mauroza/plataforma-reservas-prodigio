import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { buscarEnMenu } from '@/lib/menu-search'

export const dynamic = 'force-dynamic'

function auth(req: Request) {
  return req.headers.get('x-api-key') === process.env.N8N_API_KEY
}

// GET /api/n8n/menu?q=...&categoria=...&limite=10 — el agente de WhatsApp consulta la carta
export async function GET(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const categoria = searchParams.get('categoria') ?? ''
  const limite = Math.min(Math.max(Number(searchParams.get('limite')) || 10, 1), 25)

  const items = await prisma.menuItem.findMany({ orderBy: [{ orden: 'asc' }, { nombre: 'asc' }] })
  return NextResponse.json(buscarEnMenu(items, q, categoria, limite))
}
