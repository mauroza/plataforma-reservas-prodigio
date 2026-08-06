import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/paquetes/ventas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD — listar ventas (consolidado por periodo)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')

  const where: Record<string, unknown> = {}
  if (desde || hasta) {
    where.fecha = {
      ...(desde ? { gte: new Date(`${desde}T00:00:00-05:00`) } : {}),
      ...(hasta ? { lte: new Date(`${hasta}T23:59:59-05:00`) } : {}),
    }
  }

  const ventas = await prisma.packageSale.findMany({
    where,
    include: { package: { select: { nombre: true } } },
    orderBy: { fecha: 'desc' },
  })

  return NextResponse.json({
    ventas: ventas.map(v => ({
      id: v.id,
      packageId: v.packageId,
      paqueteNombre: v.package.nombre,
      cliente: v.cliente ?? undefined,
      cantidad: v.cantidad,
      montoTotal: v.montoTotal,
      fecha: v.fecha.toISOString(),
      notas: v.notas ?? undefined,
    })),
  })
}

// POST /api/paquetes/ventas — registrar una venta
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { packageId, cliente, cantidad, montoTotal, fecha, notas } = await req.json() as {
    packageId: string
    cliente?: string
    cantidad?: number
    montoTotal: number
    fecha?: string
    notas?: string
  }

  if (!packageId || montoTotal === undefined || montoTotal === null) {
    return NextResponse.json({ error: 'packageId y montoTotal son requeridos' }, { status: 400 })
  }

  const venta = await prisma.packageSale.create({
    data: {
      packageId,
      cliente: cliente ?? null,
      cantidad: cantidad ? Number(cantidad) : 1,
      montoTotal: Number(montoTotal),
      fecha: fecha ? new Date(fecha) : new Date(),
      notas: notas ?? null,
    },
    include: { package: { select: { nombre: true } } },
  })

  return NextResponse.json({
    success: true,
    venta: {
      id: venta.id,
      packageId: venta.packageId,
      paqueteNombre: venta.package.nombre,
      cliente: venta.cliente ?? undefined,
      cantidad: venta.cantidad,
      montoTotal: venta.montoTotal,
      fecha: venta.fecha.toISOString(),
      notas: venta.notas ?? undefined,
    },
  }, { status: 201 })
}
