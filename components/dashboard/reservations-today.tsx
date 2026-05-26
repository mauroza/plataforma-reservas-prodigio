'use client'

import { useState } from 'react'
import { Clock, Users, MapPin, Phone, ChevronRight } from 'lucide-react'
import type { Reserva } from '@/types'
import {
  formatTime, getReservationStatusStyle, getReservationStatusLabel, cn,
} from '@/lib/utils'

interface Props { reservas: Reserva[] }

const ZONE_LABEL: Record<string, string> = {
  salon_interno: 'Salón Interno',
  terraza:       'Terraza',
}

export function ReservationsToday({ reservas }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  const sorted = [...reservas].sort(
    (a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
  )

  if (sorted.length === 0) {
    return (
      <div className="card p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
        <Clock className="w-10 h-10 text-[#f2efe8]/20 mb-3" />
        <p className="text-[#f2efe8]/40 text-sm">No hay reservas para hoy</p>
      </div>
    )
  }

  return (
    <div className="card divide-y divide-[rgba(204,199,159,0.08)]">
      {sorted.map(r => {
        const open = selected === r.id
        return (
          <div key={r.id} className="transition-colors hover:bg-[rgba(255,255,255,0.02)]">
            <button
              className="w-full text-left px-4 py-3.5 flex items-center gap-4"
              onClick={() => setSelected(open ? null : r.id)}
            >
              {/* Time column */}
              <div className="w-16 shrink-0 text-center">
                <p className="text-[#ccc79f] font-semibold text-sm leading-tight">
                  {formatTime(r.fechaInicio)}
                </p>
                <p className="text-[#f2efe8]/30 text-[10px]">
                  –{formatTime(r.fechaFin)}
                </p>
              </div>

              {/* Vertical divider */}
              <div className="w-px h-10 bg-[rgba(204,199,159,0.12)] shrink-0" />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-[#f2efe8] truncate">
                    {r.nombreCliente}
                  </p>
                  <span className={cn('badge text-[10px] px-2 py-0.5', getReservationStatusStyle(r.estado))}>
                    {getReservationStatusLabel(r.estado)}
                  </span>
                  {r.ocasionEspecial && (
                    <span className="badge text-[10px] px-2 py-0.5 bg-[#ccc79f]/10 text-[#ccc79f] border border-[#ccc79f]/20">
                      {r.ocasionEspecial}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-[#f2efe8]/40">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {r.personas} personas
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {ZONE_LABEL[r.zona] ?? r.zona}
                  </span>
                  {r.mesas.length > 0 && (
                    <span className="text-[#ccc79f]/60">{r.mesas.join(' + ')}</span>
                  )}
                </div>
              </div>

              <ChevronRight className={cn(
                'w-4 h-4 text-[#f2efe8]/25 shrink-0 transition-transform',
                open && 'rotate-90',
              )} />
            </button>

            {/* Expanded detail */}
            {open && (
              <div className="px-4 pb-4 pt-1 bg-[rgba(0,0,0,0.15)] border-t animate-fade-in"
                   style={{ borderColor: 'rgba(204,199,159,0.08)' }}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-[#f2efe8]/35 uppercase tracking-wider text-[10px] mb-1">Teléfono</p>
                    <p className="flex items-center gap-1.5 text-[#f2efe8]/70">
                      <Phone className="w-3 h-3" /> {r.telefono}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#f2efe8]/35 uppercase tracking-wider text-[10px] mb-1">Pago</p>
                    <p className="text-[#f2efe8]/70 capitalize">{r.estadoPago.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-[#f2efe8]/35 uppercase tracking-wider text-[10px] mb-1">Fuente</p>
                    <p className="text-[#f2efe8]/70">
                      {r.fuente === 'ia_whatsapp' ? 'IA · WhatsApp' : r.fuente === 'admin' ? 'Admin' : 'Staff'}
                    </p>
                  </div>
                  {r.notas && (
                    <div className="col-span-full">
                      <p className="text-[#f2efe8]/35 uppercase tracking-wider text-[10px] mb-1">Notas</p>
                      <p className="text-[#f2efe8]/60">{r.notas}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
