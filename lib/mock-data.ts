import type { Mesa, Reserva, Evento, AIMetrics, ChartDataPoint } from '@/types'

// ── MESAS ──────────────────────────────────────────────────────────────────

export const mesas: Mesa[] = [
  // ── Salón Interno — M tables (bajitas) ──────────────────────────────────
  { id: 'm1',  nombre: 'M1',  capacidad: 4, zona: 'salon_interno', tipo: 'M', activa: true, reservable: true, estado: 'disponible' },
  { id: 'm2',  nombre: 'M2',  capacidad: 4, zona: 'salon_interno', tipo: 'M', activa: true, reservable: true, estado: 'disponible' },
  { id: 'm3',  nombre: 'M3',  capacidad: 4, zona: 'salon_interno', tipo: 'M', activa: true, reservable: true, estado: 'reservada',
    reservaActual: { id: 'r4', nombreCliente: 'Andrea Gómez', personas: 4, inicio: '2026-05-22T19:00:00', fin: '2026-05-22T21:00:00' } },
  { id: 'm4',  nombre: 'M4',  capacidad: 4, zona: 'salon_interno', tipo: 'M', activa: true, reservable: true, estado: 'disponible' },
  { id: 'm5',  nombre: 'M5',  capacidad: 4, zona: 'salon_interno', tipo: 'M', activa: true, reservable: true, estado: 'ocupada',
    reservaActual: { id: 'r6', nombreCliente: 'Hernán Vargas', personas: 4, inicio: '2026-05-22T19:00:00', fin: '2026-05-22T21:00:00' } },
  { id: 'm6',  nombre: 'M6',  capacidad: 5, zona: 'salon_interno', tipo: 'M', activa: true, reservable: true, estado: 'disponible' },
  { id: 'm7',  nombre: 'M7',  capacidad: 3, zona: 'salon_interno', tipo: 'M', activa: true, reservable: true, estado: 'reservada',
    reservaActual: { id: 'r8', nombreCliente: 'Luis Morales', personas: 10, inicio: '2026-05-22T20:00:00', fin: '2026-05-22T22:30:00' } },
  { id: 'm8',  nombre: 'M8',  capacidad: 4, zona: 'salon_interno', tipo: 'M', activa: true, reservable: true, estado: 'reservada',
    reservaActual: { id: 'r8', nombreCliente: 'Luis Morales', personas: 10, inicio: '2026-05-22T20:00:00', fin: '2026-05-22T22:30:00' } },
  { id: 'm9',  nombre: 'M9',  capacidad: 4, zona: 'salon_interno', tipo: 'M', activa: true, reservable: true, estado: 'disponible' },
  { id: 'm10', nombre: 'M10', capacidad: 4, zona: 'salon_interno', tipo: 'M', activa: true, reservable: true, estado: 'disponible' },

  // ── Terraza — T tables (altas) ──────────────────────────────────────────
  { id: 't11', nombre: 'T11', capacidad: 3, zona: 'terraza', tipo: 'T', activa: true, reservable: true, estado: 'ocupada',
    reservaActual: { id: 'r5', nombreCliente: 'Sara Jiménez', personas: 3, inicio: '2026-05-22T19:30:00', fin: '2026-05-22T21:00:00' } },
  { id: 't12', nombre: 'T12', capacidad: 3, zona: 'terraza', tipo: 'T', activa: true, reservable: true, estado: 'disponible' },
  { id: 't13', nombre: 'T13', capacidad: 3, zona: 'terraza', tipo: 'T', activa: true, reservable: true, estado: 'disponible' },
  { id: 't14', nombre: 'T14', capacidad: 4, zona: 'terraza', tipo: 'T', activa: true, reservable: false, estado: 'disponible' },
  { id: 't15', nombre: 'T15', capacidad: 6, zona: 'terraza', tipo: 'T', activa: true, reservable: true, estado: 'reservada',
    reservaActual: { id: 'r9', nombreCliente: 'Diego Salcedo', personas: 5, inicio: '2026-05-22T21:00:00', fin: '2026-05-22T22:30:00' } },
  { id: 't16', nombre: 'T16', capacidad: 3, zona: 'terraza', tipo: 'T', activa: true, reservable: true, estado: 'disponible' },
  { id: 't17', nombre: 'T17', capacidad: 3, zona: 'terraza', tipo: 'T', activa: true, reservable: true, estado: 'disponible' },
]

// ── RESERVAS ───────────────────────────────────────────────────────────────

export const reservas: Reserva[] = [
  // Today (2026-05-22 — Viernes)
  {
    id: 'r1', nombreCliente: 'Carlos Pérez', telefono: '3001234567',
    personas: 2, fechaInicio: '2026-05-22T12:00:00', fechaFin: '2026-05-22T13:30:00',
    estado: 'finalizada', zona: 'terraza', mesas: ['T2'],
    estadoPago: 'sin_pago', fuente: 'ia_whatsapp', creadaEn: '2026-05-21T18:30:00',
  },
  {
    id: 'r2', nombreCliente: 'Familia Rodríguez', telefono: '3109876543',
    personas: 6, fechaInicio: '2026-05-22T13:00:00', fechaFin: '2026-05-22T15:00:00',
    estado: 'finalizada', zona: 'salon_interno', mesas: ['M5'],
    estadoPago: 'sin_pago', fuente: 'ia_whatsapp', creadaEn: '2026-05-20T10:15:00',
  },
  {
    id: 'r3', nombreCliente: 'Paola Ríos', telefono: '3154321098',
    personas: 4, fechaInicio: '2026-05-22T14:30:00', fechaFin: '2026-05-22T16:30:00',
    estado: 'no_asistio', zona: 'salon_interno', mesas: ['M2'],
    estadoPago: 'sin_pago', fuente: 'ia_whatsapp', creadaEn: '2026-05-22T09:00:00',
  },
  {
    id: 'r4', nombreCliente: 'Andrea Gómez', telefono: '3187654321',
    personas: 4, fechaInicio: '2026-05-22T19:00:00', fechaFin: '2026-05-22T21:00:00',
    estado: 'confirmada', zona: 'salon_interno', mesas: ['M3'],
    ocasionEspecial: 'Aniversario', estadoPago: 'sin_pago',
    fuente: 'ia_whatsapp', creadaEn: '2026-05-21T14:00:00',
  },
  {
    id: 'r5', nombreCliente: 'Sara Jiménez', telefono: '3201122334',
    personas: 2, fechaInicio: '2026-05-22T19:30:00', fechaFin: '2026-05-22T21:00:00',
    estado: 'confirmada', zona: 'terraza', mesas: ['T1'],
    estadoPago: 'sin_pago', fuente: 'ia_whatsapp', creadaEn: '2026-05-22T08:00:00',
  },
  {
    id: 'r6', nombreCliente: 'Hernán Vargas', telefono: '3115544332',
    personas: 6, fechaInicio: '2026-05-22T19:00:00', fechaFin: '2026-05-22T21:00:00',
    estado: 'confirmada', zona: 'salon_interno', mesas: ['M5'],
    estadoPago: 'sin_pago', fuente: 'admin', creadaEn: '2026-05-21T11:00:00',
  },
  {
    id: 'r7', nombreCliente: 'Valentina Cruz', telefono: '3179988776',
    personas: 4, fechaInicio: '2026-05-22T20:00:00', fechaFin: '2026-05-22T22:00:00',
    estado: 'confirmada', zona: 'terraza', mesas: ['M9'],
    estadoPago: 'sin_pago', fuente: 'ia_whatsapp', creadaEn: '2026-05-22T10:30:00',
  },
  {
    id: 'r8', nombreCliente: 'Luis Morales', telefono: '3006677889',
    personas: 10, fechaInicio: '2026-05-22T20:00:00', fechaFin: '2026-05-22T22:30:00',
    estado: 'pendiente', zona: 'salon_interno', mesas: ['M7', 'M8'],
    notas: 'Requiere abono de $200.000', estadoPago: 'abono_pendiente',
    fuente: 'ia_whatsapp', creadaEn: '2026-05-22T12:00:00',
  },
  {
    id: 'r9', nombreCliente: 'Diego Salcedo', telefono: '3133445566',
    personas: 2, fechaInicio: '2026-05-22T21:00:00', fechaFin: '2026-05-22T22:30:00',
    estado: 'confirmada', zona: 'terraza', mesas: ['T4'],
    estadoPago: 'sin_pago', fuente: 'ia_whatsapp', creadaEn: '2026-05-22T15:00:00',
  },
  {
    id: 'r10', nombreCliente: 'Marco Torres', telefono: '3148899001',
    personas: 6, fechaInicio: '2026-05-22T20:30:00', fechaFin: '2026-05-22T22:30:00',
    estado: 'cancelada', zona: 'salon_interno', mesas: ['M6'],
    estadoPago: 'sin_pago', fuente: 'ia_whatsapp', creadaEn: '2026-05-20T16:00:00',
  },

  // Tomorrow (2026-05-23 — Sábado)
  {
    id: 'r11', nombreCliente: 'Camila Suárez', telefono: '3162233445',
    personas: 4, fechaInicio: '2026-05-23T13:00:00', fechaFin: '2026-05-23T15:00:00',
    estado: 'confirmada', zona: 'terraza', mesas: ['M10'],
    estadoPago: 'sin_pago', fuente: 'ia_whatsapp', creadaEn: '2026-05-22T09:30:00',
  },
  {
    id: 'r12', nombreCliente: 'Jorge Londoño', telefono: '3175566778',
    personas: 8, fechaInicio: '2026-05-23T19:00:00', fechaFin: '2026-05-23T21:30:00',
    estado: 'confirmada', zona: 'salon_interno', mesas: ['M4', 'M7'],
    estadoPago: 'sin_pago', fuente: 'admin', creadaEn: '2026-05-21T20:00:00',
  },
  {
    id: 'r13', nombreCliente: 'Laura Ospina', telefono: '3108877665',
    personas: 2, fechaInicio: '2026-05-23T20:30:00', fechaFin: '2026-05-23T22:00:00',
    estado: 'pendiente', zona: 'terraza', mesas: ['T3'],
    estadoPago: 'sin_pago', fuente: 'ia_whatsapp', creadaEn: '2026-05-22T17:00:00',
  },

  // Next week
  {
    id: 'r14', nombreCliente: 'Familia Castro', telefono: '3196655443',
    personas: 6, fechaInicio: '2026-05-25T12:30:00', fechaFin: '2026-05-25T14:30:00',
    estado: 'confirmada', zona: 'salon_interno', mesas: ['M5'],
    estadoPago: 'sin_pago', fuente: 'ia_whatsapp', creadaEn: '2026-05-22T11:00:00',
  },
  {
    id: 'r15', nombreCliente: 'Andrés Mejía', telefono: '3023344556',
    personas: 4, fechaInicio: '2026-05-27T19:30:00', fechaFin: '2026-05-27T21:30:00',
    estado: 'confirmada', zona: 'terraza', mesas: ['M11'],
    ocasionEspecial: 'Cumpleaños', estadoPago: 'sin_pago',
    fuente: 'ia_whatsapp', creadaEn: '2026-05-22T14:00:00',
  },
]

// ── EVENTOS ────────────────────────────────────────────────────────────────

export const eventos: Evento[] = [
  {
    id: 'e1',
    nombre: 'Cumpleaños Empresarial TechSoft',
    empresaPersona: 'TechSoft Colombia',
    personas: 25,
    fechaInicio: '2026-05-25T19:00:00',
    fechaFin: '2026-05-25T23:00:00',
    tipoEvento: 'Corporativo',
    opcionMenu: 'menu_90k',
    estadoPago: 'abono_pagado',
    montoTotal: 2_250_000,
    montoAbono: 1_125_000,
    necesidadesEspeciales: 'Decoración corporativa, mesero adicional',
    estado: 'confirmado',
    creadaEn: '2026-05-10T10:00:00',
  },
  {
    id: 'e2',
    nombre: 'Reunión Corporativa Banco XYZ',
    empresaPersona: 'Banco XYZ',
    personas: 30,
    fechaInicio: '2026-05-28T12:00:00',
    fechaFin: '2026-05-28T16:00:00',
    tipoEvento: 'Corporativo',
    opcionMenu: 'menu_75k',
    estadoPago: 'abono_pendiente',
    montoTotal: 2_250_000,
    montoAbono: 1_125_000,
    necesidadesEspeciales: 'Proyector, presentación formal',
    estado: 'pendiente',
    creadaEn: '2026-05-15T14:30:00',
  },
  {
    id: 'e3',
    nombre: 'Grado Familiar Ríos',
    empresaPersona: 'Familia Ríos Montoya',
    personas: 35,
    fechaInicio: '2026-05-30T19:00:00',
    fechaFin: '2026-05-30T23:00:00',
    tipoEvento: 'Social / Familiar',
    opcionMenu: 'menu_90k',
    estadoPago: 'abono_pagado',
    montoTotal: 3_150_000,
    montoAbono: 1_575_000,
    necesidadesEspeciales: 'Decoración con globos y flores, torta',
    estado: 'confirmado',
    creadaEn: '2026-05-08T09:00:00',
  },
  {
    id: 'e4',
    nombre: 'Evento Privado Empresa Cívica',
    empresaPersona: 'Empresa Cívica S.A.S',
    personas: 22,
    fechaInicio: '2026-06-05T19:30:00',
    fechaFin: '2026-06-05T23:30:00',
    tipoEvento: 'Corporativo',
    opcionMenu: 'sin_definir',
    estadoPago: 'sin_pago',
    montoTotal: undefined,
    necesidadesEspeciales: 'En cotización',
    estado: 'pendiente',
    creadaEn: '2026-05-22T11:00:00',
  },
]

// ── AI METRICS ─────────────────────────────────────────────────────────────

export const aiMetrics: AIMetrics = {
  conversaciones: 89,
  reservasCreadas: 67,
  eventosCreados: 4,
  cancelaciones: 12,
  tasaConversion: 75.3,
  tiempoRespuestaMin: 1.2,
}

// ── CHART DATA ─────────────────────────────────────────────────────────────

export const reservasPorDia: ChartDataPoint[] = [
  { label: '22 Abr', value: 8 },  { label: '23 Abr', value: 5 },
  { label: '24 Abr', value: 6 },  { label: '25 Abr', value: 9 },
  { label: '26 Abr', value: 11 }, { label: '27 Abr', value: 14 },
  { label: '28 Abr', value: 10 }, { label: '29 Abr', value: 4 },
  { label: '30 Abr', value: 7 },  { label: '01 May', value: 9 },
  { label: '02 May', value: 6 },  { label: '03 May', value: 13 },
  { label: '04 May', value: 16 }, { label: '05 May', value: 7 },
  { label: '06 May', value: 5 },  { label: '07 May', value: 8 },
  { label: '08 May', value: 10 }, { label: '09 May', value: 12 },
  { label: '10 May', value: 15 }, { label: '11 May', value: 18 },
  { label: '12 May', value: 9 },  { label: '13 May', value: 6 },
  { label: '14 May', value: 8 },  { label: '15 May', value: 11 },
  { label: '16 May', value: 10 }, { label: '17 May', value: 13 },
  { label: '18 May', value: 16 }, { label: '19 May', value: 20 },
  { label: '20 May', value: 12 }, { label: '21 May', value: 9 },
  { label: '22 May', value: 8 },
]

export const reservasPorHora: ChartDataPoint[] = [
  { label: '12:00', value: 5 }, { label: '13:00', value: 8 },
  { label: '14:00', value: 6 }, { label: '15:00', value: 3 },
  { label: '16:00', value: 2 }, { label: '17:00', value: 4 },
  { label: '18:00', value: 7 }, { label: '19:00', value: 14 },
  { label: '20:00', value: 18 }, { label: '21:00', value: 12 },
  { label: '22:00', value: 5 },
]

export const estadosReservas: ChartDataPoint[] = [
  { label: 'Confirmadas', value: 67 },
  { label: 'Pendientes',  value: 14 },
  { label: 'Canceladas',  value: 12 },
  { label: 'Finalizadas', value: 89 },
  { label: 'No asistió',  value: 8  },
]

// ── HELPERS ────────────────────────────────────────────────────────────────

export function getReservasHoy(): Reserva[] {
  return reservas.filter(r => r.fechaInicio.startsWith('2026-05-22'))
}

export function getMesasDisponibles(): number {
  return mesas.filter(m => m.reservable && m.estado === 'disponible').length
}

export function getMesasOcupadas(): number {
  return mesas.filter(m => m.estado === 'ocupada' || m.estado === 'reservada').length
}

export function getTotalPersonasHoy(): number {
  return getReservasHoy()
    .filter(r => r.estado !== 'cancelada' && r.estado !== 'no_asistio')
    .reduce((sum, r) => sum + r.personas, 0)
}
