import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isToday, isFuture, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ReservationStatus, TableStatus, PaymentStatus, EventStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string, fmt = "dd 'de' MMMM, yyyy"): string {
  try { return format(parseISO(dateStr), fmt, { locale: es }) } catch { return dateStr }
}

export function formatTime(dateStr: string): string {
  try { return format(parseISO(dateStr), 'h:mm a', { locale: es }) } catch { return '' }
}

export function formatDateTime(dateStr: string): string {
  try { return format(parseISO(dateStr), "dd MMM · h:mm a", { locale: es }) } catch { return dateStr }
}

export function formatDateShort(dateStr: string): string {
  try { return format(parseISO(dateStr), 'dd MMM', { locale: es }) } catch { return dateStr }
}

export function isDateToday(dateStr: string): boolean {
  try { return isToday(parseISO(dateStr)) } catch { return false }
}

export function isDateFuture(dateStr: string): boolean {
  try { return isFuture(parseISO(dateStr)) } catch { return false }
}

export function isDatePast(dateStr: string): boolean {
  try { return isPast(parseISO(dateStr)) } catch { return false }
}

export function getDayOfWeek(): string {
  return format(new Date(), "EEEE", { locale: es })
}

export function getTodayFormatted(): string {
  return format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })
}

// ── Status helpers ─────────────────────────────────────────────────────────

export function getReservationStatusStyle(status: ReservationStatus): string {
  const map: Record<ReservationStatus, string> = {
    confirmada:  'bg-emerald-400/10 text-emerald-400  border border-emerald-400/25',
    pendiente:   'bg-amber-400/10   text-amber-400    border border-amber-400/25',
    cancelada:   'bg-red-400/10     text-red-400      border border-red-400/25',
    finalizada:  'bg-green-700/15   text-green-400    border border-green-700/25',
    no_asistio:  'bg-rose-900/20    text-rose-300     border border-rose-800/25',
  }
  return map[status] ?? 'bg-gray-400/10 text-gray-400 border border-gray-400/20'
}

export function getReservationStatusLabel(status: ReservationStatus): string {
  const map: Record<ReservationStatus, string> = {
    confirmada: 'Confirmada',
    pendiente:  'Pendiente',
    cancelada:  'Cancelada',
    finalizada: 'Finalizada',
    no_asistio: 'No asistió',
  }
  return map[status] ?? status
}

export function getTableStatusStyle(status: TableStatus): string {
  const map: Record<TableStatus, string> = {
    disponible: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    ocupada:    'bg-red-500/15     border-red-500/30     text-red-400',
    reservada:  'bg-amber-500/15   border-amber-500/30   text-amber-400',
    bloqueada:  'bg-gray-500/15    border-gray-500/30    text-gray-400',
  }
  return map[status] ?? ''
}

export function getTableStatusLabel(status: TableStatus): string {
  const map: Record<TableStatus, string> = {
    disponible: 'Disponible',
    ocupada:    'Ocupada',
    reservada:  'Reservada',
    bloqueada:  'Bloqueada',
  }
  return map[status] ?? status
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    sin_pago:       'Sin pago',
    abono_pendiente:'Abono pendiente',
    abono_pagado:   'Abono pagado',
    pagado_total:   'Pagado total',
  }
  return map[status] ?? status
}

export function getPaymentStatusStyle(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    sin_pago:       'text-gray-400',
    abono_pendiente:'text-amber-400',
    abono_pagado:   'text-blue-400',
    pagado_total:   'text-emerald-400',
  }
  return map[status] ?? 'text-gray-400'
}

export function getEventStatusStyle(status: EventStatus): string {
  const map: Record<EventStatus, string> = {
    pendiente:  'bg-amber-400/10 text-amber-400  border border-amber-400/25',
    confirmado: 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/25',
    cancelado:  'bg-red-400/10   text-red-400    border border-red-400/25',
    finalizado: 'bg-green-700/15 text-green-400  border border-green-700/25',
  }
  return map[status] ?? ''
}

export function getEventStatusLabel(status: EventStatus): string {
  const map: Record<EventStatus, string> = {
    pendiente:  'Pendiente',
    confirmado: 'Confirmado',
    cancelado:  'Cancelado',
    finalizado: 'Finalizado',
  }
  return map[status] ?? status
}

export function getReservationDurationMinutes(personas: number): number {
  if (personas <= 2) return 90
  if (personas <= 6) return 120
  return 150
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount)
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
