import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { PaquetesView } from '@/components/paquetes/paquetes-view'
import type { Paquete, VentaPaquete } from '@/types'

export const metadata: Metadata = { title: 'Paquetes' }
export const dynamic = 'force-dynamic'

export default async function PaquetesPage() {
  const [rowsPaquetes, rowsVentas] = await Promise.all([
    prisma.package.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.packageSale.findMany({
      include: { package: { select: { nombre: true } } },
      orderBy: { fecha: 'desc' },
    }),
  ])

  const paquetes: Paquete[] = rowsPaquetes.map(p => ({
    id:          p.id,
    nombre:      p.nombre,
    descripcion: p.descripcion ?? undefined,
    costo:       p.costo,
    activo:      p.activo,
    creadaEn:    p.createdAt.toISOString(),
  }))

  const ventas: VentaPaquete[] = rowsVentas.map(v => ({
    id:            v.id,
    packageId:     v.packageId,
    paqueteNombre: v.package.nombre,
    cliente:       v.cliente ?? undefined,
    cantidad:      v.cantidad,
    montoTotal:    v.montoTotal,
    fecha:         v.fecha.toISOString(),
    notas:         v.notas ?? undefined,
  }))

  return <PaquetesView initialPaquetes={paquetes} initialVentas={ventas} />
}
