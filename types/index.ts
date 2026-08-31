export type ReservationStatus = 'pendiente' | 'confirmada' | 'cancelada' | 'finalizada' | 'no_asistio'
export type TableStatus     = 'disponible' | 'ocupada' | 'reservada' | 'bloqueada'
export type Zone            = 'salon_interno' | 'terraza'
export type TableType       = 'M' | 'T'
export type EventStatus     = 'pendiente' | 'confirmado' | 'cancelado' | 'finalizado'
export type PaymentStatus   = 'sin_pago' | 'abono_pendiente' | 'abono_pagado' | 'pagado_total'
export type UserRole        = 'admin' | 'staff'
export type ReservationSource = 'ia_whatsapp' | 'admin' | 'staff'

export interface Mesa {
  id: string
  nombre: string
  capacidad: number
  zona: Zone
  tipo: TableType
  activa: boolean
  reservable: boolean
  estado: TableStatus
  reservaActual?: {
    id: string
    nombreCliente: string
    personas: number
    inicio: string
    fin: string
  }
}

export interface Reserva {
  id: string
  nombreCliente: string
  telefono: string
  personas: number
  fechaInicio: string
  fechaFin: string
  estado: ReservationStatus
  zona: Zone
  mesas: string[]
  ocasionEspecial?: string
  alergenos?: string
  estadoPago: PaymentStatus
  notas?: string
  fuente: ReservationSource
  creadaEn: string
  packageId?: string
  paqueteNombre?: string
}

export interface Evento {
  id: string
  nombre: string
  empresaPersona: string
  personas: number
  fechaInicio: string
  fechaFin: string
  tipoEvento: string
  opcionMenu: 'menu_90k' | 'menu_75k' | 'sin_definir'
  estadoPago: PaymentStatus
  montoTotal?: number
  montoAbono?: number
  necesidadesEspeciales?: string
  notas?: string
  estado: EventStatus
  creadaEn: string
}

export interface Paquete {
  id: string
  nombre: string
  descripcion?: string
  costo: number
  activo: boolean
  creadaEn: string
}

export interface VentaPaquete {
  id: string
  packageId: string
  paqueteNombre: string
  cliente?: string
  cantidad: number
  montoTotal: number
  fecha: string
  notas?: string
}

export interface AIMetrics {
  conversaciones: number
  reservasCreadas: number
  eventosCreados: number
  cancelaciones: number
  tasaConversion: number
  tiempoRespuestaMin: number
}

export interface ChartDataPoint {
  label: string
  value: number
}

export interface NavItem {
  label: string
  href: string
  icon: (props: { className?: string }) => JSX.Element | null
}
