'use client'

import {
  LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Zap, TrendingUp, Users, XCircle, AlertCircle, CalendarCheck2 } from 'lucide-react'
import type { AIMetrics, ChartDataPoint } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  kpis: {
    total:       number
    confirmadas: number
    canceladas:  number
    noShow:      number
    avgPersonas: number
  }
  aiMetrics:        AIMetrics
  reservasPorDia:   ChartDataPoint[]
  reservasPorHora:  ChartDataPoint[]
  estadosReservas:  ChartDataPoint[]
}

// Brand-aligned chart colors
const GOLD    = '#ccc79f'
const SAGE    = '#95be9a'
const CORAL   = '#cf5f56'
const WINE    = '#7a3a4a'
const TAUPE   = '#c0bdad'
const PIE_COLORS = [SAGE, '#d4a929', CORAL, GOLD, WINE]

const tooltipStyle = {
  backgroundColor: '#19191c',
  border: '1px solid rgba(204,199,159,0.15)',
  borderRadius: '10px',
  color: '#f2efe8',
  fontSize: 12,
}

export function AnaliticasView({ kpis, aiMetrics, reservasPorDia, reservasPorHora, estadosReservas }: Props) {
  const tasaCancelacion = kpis.total > 0 ? Math.round((kpis.canceladas / kpis.total) * 100) : 0
  const tasaNoShow      = kpis.total > 0 ? Math.round((kpis.noShow     / kpis.total) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── KPI cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total reservas',    value: kpis.total,       icon: CalendarCheck2, color: 'text-[#ccc79f]',  bg: 'bg-[#ccc79f]/10'  },
          { label: 'Confirmadas',       value: kpis.confirmadas, icon: TrendingUp,     color: 'text-[#95be9a]',  bg: 'bg-[#95be9a]/10'  },
          { label: 'Canceladas',        value: kpis.canceladas,  icon: XCircle,        color: 'text-[#cf5f56]',  bg: 'bg-[#cf5f56]/10'  },
          { label: 'No asistió',        value: kpis.noShow,      icon: AlertCircle,    color: 'text-rose-300',   bg: 'bg-rose-900/15'   },
          { label: 'Promedio personas', value: `${kpis.avgPersonas}p`, icon: Users,   color: 'text-[#c0bdad]',  bg: 'bg-[#c0bdad]/10'  },
        ].map(k => (
          <div key={k.label} className="card p-4 flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', k.bg)}>
              <k.icon className={cn('w-4 h-4', k.color)} />
            </div>
            <div>
              <p className="text-xl font-semibold text-[#f2efe8] leading-none">{k.value}</p>
              <p className="text-[10px] text-[#f2efe8]/38 mt-0.5">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts row 1 ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Line chart — reservas por día */}
        <div className="xl:col-span-2 card p-5">
          <p className="text-sm font-semibold text-[#f2efe8] mb-1">Reservas por día</p>
          <p className="text-xs text-[#f2efe8]/35 mb-5">Últimos 30 días</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={reservasPorDia} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(204,199,159,0.08)" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'rgba(242,239,232,0.35)', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(204,199,159,0.1)' }}
                interval={4}
              />
              <YAxis
                tick={{ fill: 'rgba(242,239,232,0.35)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'rgba(204,199,159,0.15)' }} />
              <Line
                type="monotone"
                dataKey="value"
                name="Reservas"
                stroke={GOLD}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: GOLD, stroke: '#0c0c0d', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — estados */}
        <div className="card p-5">
          <p className="text-sm font-semibold text-[#f2efe8] mb-1">Distribución de estados</p>
          <p className="text-xs text-[#f2efe8]/35 mb-4">Todas las reservas</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={estadosReservas}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {estadosReservas.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="mt-3 space-y-1.5">
            {estadosReservas.map((d, i) => (
              <div key={d.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-[#f2efe8]/55">{d.label}</span>
                </div>
                <span className="text-[#f2efe8]/70 font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts row 2 ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Bar chart — reservas por hora */}
        <div className="xl:col-span-2 card p-5">
          <p className="text-sm font-semibold text-[#f2efe8] mb-1">Reservas por hora</p>
          <p className="text-xs text-[#f2efe8]/35 mb-5">Distribución de horarios pico</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={reservasPorHora} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(204,199,159,0.08)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'rgba(242,239,232,0.35)', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(204,199,159,0.1)' }}
              />
              <YAxis
                tick={{ fill: 'rgba(242,239,232,0.35)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(204,199,159,0.05)' }} />
              <Bar dataKey="value" name="Reservas" fill={SAGE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick stats column */}
        <div className="space-y-4">
          {/* Conversion rates */}
          <div className="card p-5">
            <p className="text-sm font-semibold text-[#f2efe8] mb-4">Tasas operativas</p>
            <div className="space-y-3">
              {[
                { label: 'Tasa cancelación', value: tasaCancelacion, color: '#cf5f56' },
                { label: 'Tasa no-show',     value: tasaNoShow,      color: '#7a3a4a' },
                { label: 'Tasa confirmación', value: kpis.total > 0 ? Math.round((kpis.confirmadas / kpis.total) * 100) : 0, color: '#95be9a' },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[#f2efe8]/55">{stat.label}</span>
                    <span className="font-semibold" style={{ color: stat.color }}>{stat.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${stat.value}%`, background: stat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Metrics ───────────────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-[#ccc79f]/12 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-[#ccc79f]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#f2efe8]">Métricas del Agente IA</p>
            <p className="text-xs text-[#f2efe8]/35">Últimos 30 días · WhatsApp</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Conversaciones',     value: aiMetrics.conversaciones,             unit: '' },
            { label: 'Reservas creadas',   value: aiMetrics.reservasCreadas,            unit: '' },
            { label: 'Eventos generados',  value: aiMetrics.eventosCreados,             unit: '' },
            { label: 'Cancelaciones',      value: aiMetrics.cancelaciones,              unit: '' },
            { label: 'Tasa conversión',    value: `${aiMetrics.tasaConversion}`,         unit: '%' },
            { label: 'T. respuesta prom.', value: `${aiMetrics.tiempoRespuestaMin}`,     unit: 'min' },
          ].map(m => (
            <div key={m.label} className="rounded-xl bg-[rgba(0,0,0,0.2)] border p-4 text-center"
                 style={{ borderColor: 'rgba(204,199,159,0.07)' }}>
              <p className="text-2xl font-semibold text-[#ccc79f] leading-none">
                {m.value}<span className="text-sm text-[#ccc79f]/60">{m.unit}</span>
              </p>
              <p className="text-[10px] text-[#f2efe8]/35 mt-1.5">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Conversion bar */}
        <div className="mt-5 pt-5 border-t" style={{ borderColor: 'rgba(204,199,159,0.08)' }}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-[#f2efe8]/45">Conversión de conversaciones a reservas</span>
            <span className="font-semibold text-[#ccc79f]">{aiMetrics.tasaConversion}%</span>
          </div>
          <div className="h-2 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2d2d32] to-[#ccc79f] transition-all duration-1000"
              style={{ width: `${aiMetrics.tasaConversion}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#f2efe8]/25 mt-1">
            <span>{aiMetrics.conversaciones} conversaciones</span>
            <span>{aiMetrics.reservasCreadas} reservas creadas</span>
          </div>
        </div>
      </div>
    </div>
  )
}
