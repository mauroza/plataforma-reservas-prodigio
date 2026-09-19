import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function auth(req: Request) {
  return req.headers.get('x-api-key') === process.env.N8N_API_KEY
}

// GET /api/n8n/plato-semana — el agente de WhatsApp consulta la recomendación de la semana
export async function GET(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const actual = await prisma.weeklyFeature.findUnique({ where: { id: 'actual' } })

  if (!actual) {
    return NextResponse.json({ hayRecomendacion: false })
  }

  return NextResponse.json({
    hayRecomendacion: true,
    platoNombre: actual.platoNombre,
    descripcion: actual.descripcion ?? undefined,
  })
}
