import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function auth(req: Request) {
  return req.headers.get('x-api-key') === process.env.N8N_API_KEY
}

// GET /api/n8n/vegetarianos — el agente de WhatsApp consulta las opciones vegetarianas
export async function GET(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const opciones = await prisma.vegetarianOption.findMany({
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({
    hayOpciones: opciones.length > 0,
    opciones: opciones.map(o => ({ nombre: o.nombre, notas: o.notas ?? undefined })),
  })
}
