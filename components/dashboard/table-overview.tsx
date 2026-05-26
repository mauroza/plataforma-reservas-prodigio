import type { Mesa } from '@/types'
import { getTableStatusLabel, getTableStatusStyle, formatTime, cn } from '@/lib/utils'

interface Props { mesas: Mesa[] }

const ZONE_LABEL: Record<string, string> = {
  salon_interno: 'Salón Interno',
  terraza:       'Terraza',
}

export function TableOverview({ mesas }: Props) {
  const zones = ['salon_interno', 'terraza'] as const

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-[#f2efe8] mb-4">Estado de Mesas</h2>

      {zones.map(zone => {
        const zoneMesas = mesas.filter(m => m.zona === zone)
        return (
          <div key={zone} className="mb-5 last:mb-0">
            <p className="text-[10px] uppercase tracking-widest text-[#f2efe8]/35 font-medium mb-2.5">
              {ZONE_LABEL[zone]}
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2">
              {zoneMesas.map(mesa => (
                <div
                  key={mesa.id}
                  className={cn(
                    'relative rounded-xl border p-2 text-center cursor-default',
                    'transition-all duration-200',
                    mesa.reservable
                      ? getTableStatusStyle(mesa.estado)
                      : 'bg-gray-800/20 border-gray-700/20 text-gray-600',
                  )}
                  title={
                    !mesa.reservable
                      ? 'No disponible para reservas'
                      : mesa.reservaActual
                      ? `${mesa.reservaActual.nombreCliente} · ${formatTime(mesa.reservaActual.inicio)}`
                      : getTableStatusLabel(mesa.estado)
                  }
                >
                  <p className="text-xs font-bold leading-none">{mesa.nombre}</p>
                  <p className="text-[9px] opacity-70 mt-0.5">{mesa.capacidad}p</p>
                  {mesa.reservaActual && (
                    <p className="text-[8px] opacity-60 mt-0.5 truncate">
                      {formatTime(mesa.reservaActual.inicio)}
                    </p>
                  )}
                  {!mesa.reservable && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gray-600 flex items-center justify-center text-[7px] text-gray-300">
                      ✕
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t" style={{ borderColor: 'rgba(204,199,159,0.08)' }}>
        {[
          { status: 'disponible', label: 'Disponible' },
          { status: 'reservada',  label: 'Reservada'  },
          { status: 'ocupada',    label: 'Ocupada'    },
          { status: 'bloqueada',  label: 'Bloqueada'  },
        ].map(item => (
          <span key={item.status} className={cn('flex items-center gap-1.5 text-[10px]', getTableStatusStyle(item.status as Mesa['estado']))}>
            <span className="w-2 h-2 rounded-sm border block" />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}
