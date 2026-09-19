import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function auth(req: Request) {
  return req.headers.get('x-api-key') === process.env.N8N_API_KEY
}

// GET /api/n8n/paquetes — el agente de WhatsApp consulta el catálogo real de paquetes de decoración
export async function GET(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const paquetes = await prisma.package.findMany({
    where: { activo: true },
    orderBy: { costo: 'asc' },
  })

  return NextResponse.json({
    paquetes: paquetes.map(p => ({
      nombre: p.nombre,
      descripcion: p.descripcion ?? undefined,
      categoria: p.categoria ?? undefined,
      costo: p.costo,
    })),
  })
}
