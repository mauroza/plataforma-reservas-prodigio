import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { MenuView, type MenuItemDTO } from '@/components/menu/menu-view'

export const metadata: Metadata = { title: 'Menú' }
export const dynamic = 'force-dynamic'

export default async function MenuPage() {
  const rows = await prisma.menuItem.findMany({ orderBy: [{ orden: 'asc' }, { nombre: 'asc' }] })

  const items: MenuItemDTO[] = rows.map(r => ({
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion,
    precio: r.precio,
    categoria: r.categoria,
    subcategoria: r.subcategoria,
    orden: r.orden,
    esAlcoholico: r.esAlcoholico,
    esNuevo: r.esNuevo,
    alergenos: r.alergenos,
    vegetariano: r.vegetariano,
    picante: r.picante,
    paraCompartir: r.paraCompartir,
    notaAgente: r.notaAgente,
    disponibleHoy: r.disponibleHoy,
    enCluvi: r.enCluvi,
    agotadoCluvi: r.agotadoCluvi,
  }))

  return <MenuView initialItems={items} />
}
