import { prisma } from '@/lib/db'

const CLUVI_URL = 'https://cached.cluvi.com/v1/menu/30449/on_table/basic.json?lang=es'

interface CluviProduct {
  id: string
  label?: string
  description?: string | null
  price?: string | number | null
  image?: { thumb?: string; w_576?: string; blog?: string } | null
  is_alcoholic?: boolean | null
  is_new?: boolean | null
  out_of_stock?: boolean | null
  allergy_tags?: unknown[] | null
}

interface CluviSubcategory { label?: string; product_ids?: string[] }
interface CluviCategory { label?: string; subcategories?: CluviSubcategory[] }

export interface SyncResult {
  total: number
  creados: number
  actualizados: number
  marcadosFueraDeCluvi: number
}

function limpiarHtml(html?: string | null): string | null {
  if (!html) return null
  const texto = html
    .replace(/<\s*br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
  return texto || null
}

// Trae la carta de Cluvi y la refleja en MenuItem. Actualiza solo los campos que son de Cluvi:
// los campos propios del dashboard (alergenos, vegetariano, picante, etc.) nunca se tocan.
export async function sincronizarMenuConCluvi(): Promise<SyncResult> {
  const res = await fetch(CLUVI_URL, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Cluvi respondió ${res.status}`)
  const raw = await res.json()
  const set = Array.isArray(raw) ? raw[0] : raw
  const menu = set?.menu
  if (!menu || !Array.isArray(menu.products)) throw new Error('Formato inesperado de la carta de Cluvi')

  const categorias: CluviCategory[] = menu.categories ?? []
  const productos: CluviProduct[] = menu.products

  // product_id -> { categoria, subcategoria, orden } (si está en varias, gana la primera)
  const ubicacion = new Map<string, { categoria: string; subcategoria: string | null; orden: number }>()
  let orden = 0
  for (const cat of categorias) {
    const categoria = (cat.label ?? '').trim() || 'Sin categoría'
    for (const sub of cat.subcategories ?? []) {
      const subcategoria = (sub.label ?? '').trim() || null
      for (const pid of sub.product_ids ?? []) {
        if (!ubicacion.has(pid)) ubicacion.set(pid, { categoria, subcategoria, orden: orden++ })
      }
    }
  }

  const existentes = await prisma.menuItem.findMany({ select: { cluviId: true } })
  const yaExisten = new Set(existentes.map(e => e.cluviId))
  const vistos = new Set<string>()
  let creados = 0
  let actualizados = 0

  const pendientes: Array<() => Promise<unknown>> = []

  for (const p of productos) {
    if (!p.id || !p.label) continue
    vistos.add(p.id)
    const ub = ubicacion.get(p.id)
    const datosCluvi = {
      nombre: p.label.trim(),
      descripcion: limpiarHtml(p.description),
      precio: Number(p.price) || 0,
      categoria: ub?.categoria ?? 'Sin categoría',
      subcategoria: ub?.subcategoria ?? null,
      orden: ub?.orden ?? 9999,
      imagenUrl: p.image?.thumb ?? p.image?.w_576 ?? p.image?.blog ?? null,
      esAlcoholico: !!p.is_alcoholic,
      esNuevo: !!p.is_new,
      agotadoCluvi: !!p.out_of_stock,
      enCluvi: true,
    }
    const cluviId = p.id
    if (yaExisten.has(cluviId)) {
      pendientes.push(() => prisma.menuItem.update({ where: { cluviId }, data: datosCluvi }))
      actualizados++
    } else {
      pendientes.push(() => prisma.menuItem.create({ data: { cluviId, ...datosCluvi } }))
      creados++
    }
  }

  const BLOQUE = 20
  for (let i = 0; i < pendientes.length; i += BLOQUE) {
    await Promise.all(pendientes.slice(i, i + BLOQUE).map(fn => fn()))
  }

  // Lo que ya no viene en Cluvi no se borra (se pierden los campos propios): solo se marca.
  const fuera = await prisma.menuItem.updateMany({
    where: { cluviId: { notIn: Array.from(vistos) }, enCluvi: true },
    data: { enCluvi: false },
  })

  return { total: vistos.size, creados, actualizados, marcadosFueraDeCluvi: fuera.count }
}
