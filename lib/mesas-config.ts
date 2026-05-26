// Reglas físicas del restaurante — extraídas del documento oficial
// T y M nunca se combinan (alturas distintas).
// T14 no se reserva sola pero puede sumarse a combinaciones de T11.

export const COMBINACIONES: Record<string, string[]> = {
  M1:  ['M2'],
  M2:  ['M1', 'M3', 'M4', 'M9'],
  M3:  ['M1', 'M2'],
  M4:  ['M2'],
  M5:  ['M6'],
  M6:  ['M5', 'M7'],
  M7:  ['M6'],
  M8:  [],          // mesa sola, sin combinación
  M9:  ['M10', 'M2'],
  M10: ['M9'],
  T11: ['T12', 'T13', 'T14', 'T15', 'T16', 'T17'],
  T12: ['T11', 'T13'],
  T13: ['T11', 'T12'],
  T14: ['T11'],     // solo se une a T11 para grupos grandes; no se reserva sola
  T15: ['T11', 'T16', 'T17'],
  T16: ['T11', 'T15', 'T17'],
  T17: ['T11', 'T15', 'T16'],
}

// Verifica si un conjunto de mesas puede combinarse entre sí
export function puedeCombinar(nombres: string[]): boolean {
  if (nombres.length <= 1) return true
  for (let i = 0; i < nombres.length; i++) {
    for (let j = i + 1; j < nombres.length; j++) {
      const a = nombres[i], b = nombres[j]
      if (!COMBINACIONES[a]?.includes(b) || !COMBINACIONES[b]?.includes(a)) {
        return false
      }
    }
  }
  return true
}

// Clasificación de la reserva por número de personas
export function clasificarReserva(personas: number): 'reserva' | 'reserva_abono' | 'evento' {
  if (personas <= 10) return 'reserva'
  if (personas < 20)  return 'reserva_abono'
  return 'evento'
}

export const ABONO_RESERVA = 200_000   // COP — para grupos 11-19 personas
export const ABONO_EVENTO_PCT = 0.5    // 50% del total para eventos
