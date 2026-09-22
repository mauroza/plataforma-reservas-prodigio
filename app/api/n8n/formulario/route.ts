import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function auth(req: Request) {
  return req.headers.get('x-api-key') === process.env.N8N_API_KEY
}

// GET /api/n8n/formulario — el agente de WhatsApp consulta el link del formulario de cierre
export async function GET(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const actual = await prisma.closingForm.findUnique({ where: { id: 'actual' } })

  if (!actual) {
    return NextResponse.json({ hayFormulario: false })
  }

  return NextResponse.json({
    hayFormulario: true,
    url: actual.url,
    descripcion: actual.descripcion ?? undefined,
  })
}
