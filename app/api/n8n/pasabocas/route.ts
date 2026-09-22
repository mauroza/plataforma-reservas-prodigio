import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function auth(req: Request) {
  return req.headers.get('x-api-key') === process.env.N8N_API_KEY
}

// GET /api/n8n/pasabocas — el agente de WhatsApp consulta los pasabocas disponibles para eventos
export async function GET(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const pasabocas = await prisma.pasaboca.findMany({
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({
    hayPasabocas: pasabocas.length > 0,
    pasabocas: pasabocas.map(p => ({
      nombre: p.nombre,
      descripcion: p.descripcion ?? undefined,
      precio: p.precio,
    })),
  })
}
