import type { Metadata } from 'next'
import { AnaliticasView } from '@/components/analiticas/analiticas-view'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Analíticas' }
export const dynamic = 'force-dynamic'

export default async function AnaliticasPage() {
  const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60_000)

  const reservas = await prisma.reservation.findMany({
    where: { createdAt: { gte: hace30 } },
    select: {
      estado: true,
      personas: true,
      fechaInicio: true,
      fuente: true,
      createdAt: true,
    },
    orderBy: { fechaInicio: 'asc' },
  })

  // KPIs
  const total       = reservas.length
  const confirmadas = reservas.filter(r => r.estado === 'confirmada' || r.estado === 'finalizada').length
  const canceladas  = reservas.filter(r => r.estado === 'cancelada').length
  const noShow      = reservas.filter(r => r.estado === 'no_asistio').length
  const avgPersonas = Math.round(reservas.reduce((s, r) => s + r.personas, 0) / (total || 1))

  // Métricas IA
  const iaTotal = reservas.filter(r => r.fuente === 'ia_whatsapp').length
  const tasaConv = total > 0 ? Math.round((iaTotal / total) * 100) : 0

  const aiMetrics = {
    conversaciones:    iaTotal,
    reservasCreadas:   iaTotal,
    eventosCreados:    await prisma.event.count({ where: { createdAt: { gte: hace30 } } }),
    cancelaciones:     canceladas,
    tasaConversion:    tasaConv,
    tiempoRespuestaMin: 0,
  }

  // Reservas por día (últimos 30 días)
  const porDiaMap = new Map<string, number>()
  for (const r of reservas) {
    const dia = r.fechaInicio.toLocaleDateString('es-CO', { timeZone: 'America/Bogota', weekday: 'short' })
    porDiaMap.set(dia, (porDiaMap.get(dia) ?? 0) + 1)
  }
  const reservasPorDia = Array.from(porDiaMap.entries()).map(([label, value]) => ({ label, value }))

  // Reservas por hora
  const porHoraMap = new Map<string, number>()
  for (const r of reservas) {
    const hora = r.fechaInicio.toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' })
    porHoraMap.set(hora, (porHoraMap.get(hora) ?? 0) + 1)
  }
  const reservasPorHora = Array.from(porHoraMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, value]) => ({ label, value }))

  // Estado de reservas
  const estadosReservas = [
    { label: 'Confirmadas',  value: confirmadas },
    { label: 'Canceladas',   value: canceladas  },
    { label: 'No asistió',   value: noShow      },
    { label: 'Finalizadas',  value: confirmadas },
  ]

  return (
    <AnaliticasView
      kpis={{ total, confirmadas, canceladas, noShow, avgPersonas }}
      aiMetrics={aiMetrics}
      reservasPorDia={reservasPorDia}
      reservasPorHora={reservasPorHora}
      estadosReservas={estadosReservas}
    />
  )
}
