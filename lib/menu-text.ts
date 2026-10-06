import type { MenuItem } from '@prisma/client'

function precio(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CO')
}

function normalizarNombre(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()
}

function etiquetas(i: MenuItem): string {
  const e: string[] = []
  if (i.vegetariano) e.push('vegetariano')
  if (i.picante) e.push('picante')
  if (i.paraCompartir) e.push('para compartir')
  if (i.esNuevo) e.push('nuevo')
  if (i.alergenos) e.push(`contiene: ${i.alergenos}`)
  if (i.notaAgente) e.push(`nota: ${i.notaAgente}`)
  return e.length ? ` [${e.join('; ')}]` : ''
}

export interface MenuTexto {
  hayMenu: boolean
  totalPlatos: number
  texto: string
}

// Arma el texto de la carta que recibe el agente en cada mensaje.
// Comida/brunch: nombre, precio, descripción y etiquetas. Bebidas: lista compacta por subcategoría.
export function menuParaAgente(items: MenuItem[]): MenuTexto {
  // Los platos sin categoría en Cluvi no están en la carta pública (suelen ser duplicados): el agente no los usa.
  const vigentes = items.filter(i => i.enCluvi && i.precio > 0 && i.categoria !== 'Sin categoría')
  const disponibles = vigentes.filter(i => i.disponibleHoy && !i.agotadoCluvi)
  const agotados = vigentes.filter(i => !i.disponibleHoy || i.agotadoCluvi)

  if (disponibles.length === 0) return { hayMenu: false, totalPlatos: 0, texto: '' }

  const porCategoria = new Map<string, MenuItem[]>()
  for (const i of disponibles) {
    const lista = porCategoria.get(i.categoria) ?? []
    lista.push(i)
    porCategoria.set(i.categoria, lista)
  }

  const bloques: string[] = []
  for (const [categoria, lista] of Array.from(porCategoria.entries())) {
    const esBebida = /bebida/i.test(categoria)
    const vistos = new Set<string>()
    const lineas: string[] = []

    if (esBebida) {
      const porSub = new Map<string, string[]>()
      for (const i of lista) {
        const clave = `${normalizarNombre(i.nombre)}|${i.precio}`
        if (vistos.has(clave)) continue
        vistos.add(clave)
        const sub = (i.subcategoria ?? 'Otras').trim()
        const arr = porSub.get(sub) ?? []
        arr.push(`${i.nombre.trim()} ${precio(i.precio)}${etiquetas(i)}`)
        porSub.set(sub, arr)
      }
      for (const [sub, nombres] of Array.from(porSub.entries())) lineas.push(`${sub}: ${nombres.join(' | ')}`)
    } else {
      let ultimaSub = ''
      for (const i of lista) {
        const clave = `${normalizarNombre(i.nombre)}|${i.precio}`
        if (vistos.has(clave)) continue
        vistos.add(clave)
        const sub = (i.subcategoria ?? '').trim()
        if (sub && sub !== ultimaSub) {
          lineas.push(`(${sub})`)
          ultimaSub = sub
        }
        const desc = i.descripcion ?? ''
        lineas.push(`- ${i.nombre.trim()} — ${precio(i.precio)}${desc ? ' — ' + desc : ''}${etiquetas(i)}`)
      }
    }
    bloques.push(`${categoria.trim().toUpperCase()}\n${lineas.join('\n')}`)
  }

  if (agotados.length > 0) {
    const nombres = Array.from(new Set(agotados.map(i => i.nombre.trim())))
    bloques.push(`NO DISPONIBLES HOY (no los ofrezcas; si preguntan, decí que hoy no hay): ${nombres.join(', ')}`)
  }

  return { hayMenu: true, totalPlatos: disponibles.length, texto: bloques.join('\n\n') }
}
