import type { MenuItem } from '@prisma/client'

const STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'y', 'o', 'e', 'en', 'con', 'sin',
  'que', 'tienen', 'tiene', 'tienes', 'hay', 'quiero', 'quisiera', 'algo', 'para', 'por', 'me', 'mi', 'su',
  'es', 'son', 'favor', 'cual', 'cuales', 'menu', 'carta', 'plato', 'platos', 'opcion', 'opciones',
  'recomienda', 'recomiendas', 'recomendar', 'recomendacion', 'cuanto', 'cuesta', 'precio', 'precios', 'vale',
  'ver', 'dame', 'dime', 'ustedes', 'les', 'lo', 'le', 'se', 'si', 'no', 'mas', 'muy', 'cosa', 'comer', 'tomar',
])

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function singular(t: string): string {
  if (t.length > 4 && t.endsWith('es')) return t.slice(0, -2)
  if (t.length > 3 && t.endsWith('s')) return t.slice(0, -1)
  return t
}

// Interpreta la categoría que manda el agente (nombres viejos de Cluvi o lenguaje natural).
function categoriasObjetivo(categoriaTexto: string): string[] | null {
  const c = normalizar(categoriaTexto)
  if (!c) return null
  if (/bebida|coctel|cocktail|licor|cerveza|vino|trago|sangria|mocktail|cafe|jugo|gaseosa/.test(c)) return ['Menú Bebidas']
  if (c.includes('brunch')) return ['Menú Brunch']
  const out = new Set<string>()
  if (/postre|tardear|dulce/.test(c)) out.add('POSTRES Y PARA TARDEAR')
  if (/entrada|compartir|picada/.test(c)) out.add('ENTRADAS Y PARA COMPARTIR')
  if (/fuerte|principal|corte/.test(c)) out.add('PLATOS FUERTES')
  if (out.size === 0 && /comida|plato|almuerzo|cena/.test(c)) {
    out.add('ENTRADAS Y PARA COMPARTIR'); out.add('PLATOS FUERTES'); out.add('POSTRES Y PARA TARDEAR')
  }
  return out.size ? Array.from(out) : null
}

const norm = (s?: string | null) => normalizar(s ?? '')

export function estaDisponible(i: MenuItem): boolean {
  return i.enCluvi && i.disponibleHoy && !i.agotadoCluvi
}

function formatoPrecio(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CO')
}

export interface ItemAgente {
  nombre: string
  precio: string
  categoria: string
  subcategoria?: string
  descripcion?: string
  alergenos?: string
  vegetariano: boolean
  picante: boolean
  paraCompartir: boolean
  esAlcoholico: boolean
  nota?: string
}

function paraAgente(i: MenuItem): ItemAgente {
  return {
    nombre: i.nombre,
    precio: formatoPrecio(i.precio),
    categoria: i.categoria,
    subcategoria: i.subcategoria ?? undefined,
    descripcion: i.descripcion ?? undefined,
    alergenos: i.alergenos ?? undefined,
    vegetariano: i.vegetariano,
    picante: i.picante,
    paraCompartir: i.paraCompartir,
    esAlcoholico: i.esAlcoholico,
    nota: i.notaAgente ?? undefined,
  }
}

export function buscarEnMenu(items: MenuItem[], q: string, categoriaTexto: string, limite = 10) {
  // Solo lo que existe hoy en la carta y tiene precio real
  const base = items.filter(i => i.enCluvi && i.precio > 0)

  const cats = categoriasObjetivo(categoriaTexto)
  const qn = normalizar(q)
  const filtroVeg = /vegetarian|vegan|veggie/.test(qn)
  const filtroPicante = /picante|picoso/.test(qn)
  const filtroCompartir = /compartir|para dos|picada/.test(qn)

  const tokens: string[] = qn
    .split(' ')
    .filter(t => t.length >= 3 && !STOPWORDS.has(t) && !/^vegetarian|^vegan|^veggie|^picante|^picoso|^compartir$/.test(t))

  // Los filtros por etiqueta solo aplican si el staff ya marcó platos con esa etiqueta;
  // si no, se ignoran para no responder "no existe" por falta de datos.
  const avisos: string[] = []
  const usarVeg = filtroVeg && base.some(i => i.vegetariano)
  const usarPicante = filtroPicante && base.some(i => i.picante)
  const usarCompartir = filtroCompartir && base.some(i => i.paraCompartir)
  if (filtroVeg && !usarVeg) avisos.push('Todavía no hay platos marcados como vegetarianos en el sistema: NO afirmes que un plato es o no vegetariano; para opciones vegetarianas usá el bloque OPCIONES VEGETARIANAS ACTUALES.')
  if (filtroPicante && !usarPicante) avisos.push('Todavía no hay platos marcados como picantes en el sistema: no afirmes nada sobre el picante.')

  if (filtroCompartir && !usarCompartir) tokens.push('compartir')

  let candidatos = base
  if (cats) candidatos = candidatos.filter(i => cats.includes(i.categoria))
  if (usarVeg) candidatos = candidatos.filter(i => i.vegetariano)
  if (usarPicante) candidatos = candidatos.filter(i => i.picante)
  if (usarCompartir) candidatos = candidatos.filter(i => i.paraCompartir)

  let puntuados: Array<{ item: MenuItem; score: number }>
  if (tokens.length === 0) {
    puntuados = candidatos.map(item => ({ item, score: 1 }))
  } else {
    puntuados = []
    for (const item of candidatos) {
      const nombre = norm(item.nombre)
      const sub = norm(item.subcategoria)
      const desc = norm(item.descripcion)
      const cat = norm(item.categoria)
      const extra = norm(`${item.alergenos ?? ''} ${item.notaAgente ?? ''}`)
      let score = 0
      for (const t of tokens) {
        const variantes = Array.from(new Set([t, singular(t)])).filter(v => v.length >= 3)
        const m = (campo: string) => variantes.some(v => campo.includes(v))
        if (m(nombre)) score += 5
        if (m(sub)) score += 6
        if (m(desc)) score += 2
        if (m(cat) || m(extra)) score += 1
      }
      if (score > 0) puntuados.push({ item, score })
    }
  }

  puntuados.sort((a, b) => b.score - a.score || a.item.orden - b.item.orden)

  const disponibles = puntuados.filter(p => estaDisponible(p.item))
  const noDisponibles = puntuados.filter(p => !estaDisponible(p.item))

  const sinFiltros = tokens.length === 0 && !cats && !usarVeg && !usarPicante && !usarCompartir
  const topes = tokens.length === 0 ? Math.max(limite, 40) : limite
  const mostrar = disponibles.slice(0, topes)

  const respuesta: Record<string, unknown> = {
    total: disponibles.length,
    mostrando: mostrar.length,
    items: mostrar.map(p => paraAgente(p.item)),
  }
  if (noDisponibles.length > 0) {
    respuesta.noDisponiblesHoy = noDisponibles.slice(0, 10).map(p => p.item.nombre)
  }
  if (sinFiltros || mostrar.length === 0) {
    const porCategoria = new Map<string, number>()
    for (const i of base.filter(estaDisponible)) porCategoria.set(i.categoria, (porCategoria.get(i.categoria) ?? 0) + 1)
    respuesta.categorias = Array.from(porCategoria.entries()).map(([nombre, cantidad]) => ({ nombre, cantidad }))
    if (mostrar.length === 0) avisos.push('No se encontró nada que coincida con la búsqueda. No confirmes que existe.')
  }
  if (avisos.length > 0) respuesta.aviso = avisos.join(' ')
  if (sinFiltros) {
    respuesta.items = []
    respuesta.mostrando = 0
    respuesta.aviso = avisos.length > 0
      ? avisos.join(' ')
      : 'Consulta sin filtros: elegí una categoría o preguntá por un plato concreto.'
  }
  return respuesta
}
