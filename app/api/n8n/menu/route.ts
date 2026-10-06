import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { menuParaAgente } from '@/lib/menu-text'

export const dynamic = 'force-dynamic'

function auth(req: Request) {
  return req.headers.get('x-api-key') === process.env.N8N_API_KEY
}

// GET /api/n8n/menu — el agente de WhatsApp recibe la carta completa (texto listo para su contexto)
export async function GET(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const items = await prisma.menuItem.findMany({ orderBy: [{ orden: 'asc' }, { nombre: 'asc' }] })
  return NextResponse.json(menuParaAgente(items))
}
