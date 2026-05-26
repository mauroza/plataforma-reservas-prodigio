import { CalendarCheck2, Users, UtensilsCrossed, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Stat {
  label:    string
  value:    string
  sub:      string
  icon:     React.ComponentType<{ className?: string }>
  color:    string
  bgColor:  string
}

interface StatsCardsProps {
  reservasHoy:       number
  confirmadas:       number
  mesasOcupadas:     number
  totalMesas:        number
  personasHoy:       number
  capacidadMax:      number
  eventosSemana:     number
  proximoEvento:     string
}

export function StatsCards({
  reservasHoy, confirmadas, mesasOcupadas, totalMesas,
  personasHoy, capacidadMax, eventosSemana, proximoEvento,
}: StatsCardsProps) {

  const stats: Stat[] = [
    {
      label:   'Reservas hoy',
      value:   String(reservasHoy),
      sub:     `${confirmadas} confirmadas`,
      icon:    CalendarCheck2,
      color:   'text-[#ccc79f]',
      bgColor: 'bg-[#ccc79f]/10',
    },
    {
      label:   'Mesas ocupadas',
      value:   `${mesasOcupadas}/${totalMesas}`,
      sub:     `${totalMesas - mesasOcupadas} disponibles`,
      icon:    UtensilsCrossed,
      color:   mesasOcupadas > totalMesas * 0.8 ? 'text-[#cf5f56]' : 'text-[#95be9a]',
      bgColor: mesasOcupadas > totalMesas * 0.8 ? 'bg-[#cf5f56]/10' : 'bg-[#95be9a]/10',
    },
    {
      label:   'Personas hoy',
      value:   String(personasHoy),
      sub:     `Capacidad máx: ${capacidadMax}`,
      icon:    Users,
      color:   'text-[#95be9a]',
      bgColor: 'bg-[#95be9a]/10',
    },
    {
      label:   'Eventos en la semana',
      value:   String(eventosSemana),
      sub:     proximoEvento ? `Próximo: ${proximoEvento}` : 'Sin eventos próximos',
      icon:    PartyPopper,
      color:   'text-[#d0a49b]',
      bgColor: 'bg-[#d0a49b]/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(stat => (
        <div key={stat.label} className="card card-hover p-5 animate-slide-in">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#f2efe8]/45 uppercase tracking-wider font-medium mb-3">
                {stat.label}
              </p>
              <p className="text-3xl font-semibold text-[#f2efe8] leading-none">
                {stat.value}
              </p>
              <p className="text-xs text-[#f2efe8]/40 mt-2">{stat.sub}</p>
            </div>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ml-2', stat.bgColor)}>
              <stat.icon className={cn('w-5 h-5', stat.color)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
