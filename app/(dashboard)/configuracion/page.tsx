import type { Metadata } from 'next'
import { MapPin, Clock, Phone, Users, Info, ShieldCheck } from 'lucide-react'
import { prisma } from '@/lib/db'
import { DiasEspecialesManager } from '@/components/configuracion/dias-especiales-manager'

export const metadata: Metadata = { title: 'Configuración' }
export const dynamic = 'force-dynamic'

const scheduleRows = [
  { days: 'Domingo – Miércoles', close: '10:00 PM', lastReservation: '9:00 PM'  },
  { days: 'Jueves – Sábado',     close: '11:00 PM', lastReservation: '10:00 PM' },
]

const rules = [
  { label: 'Capacidad máxima',           value: '60 personas' },
  { label: 'Buffer entre reservas',      value: '15 minutos' },
  { label: 'Reservas el mismo día',      value: 'Permitidas' },
  { label: 'Mesa NO reservable sola',    value: 'T14 (se une a T11 para grupos)' },
  { label: 'Duración 1-2 personas',      value: '1.5 horas' },
  { label: 'Duración 3-6 personas',      value: '2 horas' },
  { label: 'Duración 7+ personas',       value: '2.5 horas' },
  { label: 'Espera antes de liberar',    value: '15 min (mensaje al cliente a los 10 min)' },
  { label: 'T + M combinables',          value: 'No — T son altas, M son bajas' },
  { label: 'Abono grupos 11-19 personas', value: '$200.000 COP (Bancolombia Ahorros 37363488359)' },
  { label: 'Abono eventos (≥20 pers.)',  value: '50% del valor total' },
]

const eventMenu = [
  { tier: '$90.000 / persona', items: 'Lomo saltado · Salmón a la parrilla · Chaufa de cerdo', includes: 'Fuerte + bebida + postre' },
  { tier: '$75.000 / persona', items: 'Pollo grill Jalisco · Ensalada de pollo parrillado',    includes: 'Fuerte + bebida + postre' },
]

export default async function ConfiguracionPage() {
  const diasEspeciales = await prisma.specialDay.findMany({ orderBy: { fecha: 'asc' } })

  const diasSerializados = diasEspeciales.map(d => ({
    id:     d.id,
    nombre: d.nombre,
    fecha:  d.fecha.toISOString().split('T')[0],
    tipo:   d.tipo,
    notas:  d.notas ?? undefined,
  }))

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">

      {/* Restaurant info */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Info className="w-4 h-4 text-[#ccc79f]" />
          <h2 className="text-sm font-semibold text-[#f2efe8]">Información del Restaurante</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InfoRow icon={<ShieldCheck className="w-4 h-4" />} label="Nombre"           value="Prodigio Manizales" />
          <InfoRow icon={<MapPin className="w-4 h-4" />}      label="Dirección"         value="Carrera 1 #71-301, Manizales" />
          <InfoRow icon={<Users className="w-4 h-4" />}       label="Capacidad máxima"  value="60 personas" />
          <InfoRow icon={<Phone className="w-4 h-4" />}       label="Canal reservas IA" value="WhatsApp + n8n" />
        </div>
      </div>

      {/* Operating hours */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-4 h-4 text-[#ccc79f]" />
          <h2 className="text-sm font-semibold text-[#f2efe8]">Horarios de Operación</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: 'rgba(204,199,159,0.1)' }}>
                <th className="pb-3 text-[10px] uppercase tracking-wider text-[#f2efe8]/35 font-medium pr-6">Días</th>
                <th className="pb-3 text-[10px] uppercase tracking-wider text-[#f2efe8]/35 font-medium pr-6">Cierre</th>
                <th className="pb-3 text-[10px] uppercase tracking-wider text-[#f2efe8]/35 font-medium">Última reserva</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(204,199,159,0.08)]">
              {scheduleRows.map(r => (
                <tr key={r.days}>
                  <td className="py-3 pr-6 text-[#f2efe8]/75">{r.days}</td>
                  <td className="py-3 pr-6 text-[#ccc79f]">{r.close}</td>
                  <td className="py-3 text-[#f2efe8]/55">{r.lastReservation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operational rules */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck className="w-4 h-4 text-[#ccc79f]" />
          <h2 className="text-sm font-semibold text-[#f2efe8]">Reglas Operativas</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rules.map(r => (
            <div key={r.label} className="flex items-start gap-3 rounded-xl bg-[rgba(0,0,0,0.15)] border p-3"
                 style={{ borderColor: 'rgba(204,199,159,0.07)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccc79f]/50 mt-1.5 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#f2efe8]/35">{r.label}</p>
                <p className="text-sm text-[#f2efe8]/75 mt-0.5">{r.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Días especiales — dinámico con CRUD */}
      <DiasEspecialesManager initialDias={diasSerializados} />

      {/* Event menus */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Users className="w-4 h-4 text-[#ccc79f]" />
          <h2 className="text-sm font-semibold text-[#f2efe8]">Opciones de Menú para Eventos</h2>
        </div>
        <p className="text-xs text-[#f2efe8]/40 mb-4">Mínimo 20 personas · Incluye impoconsumo.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {eventMenu.map(m => (
            <div key={m.tier} className="rounded-xl border p-4 space-y-2"
                 style={{ borderColor: 'rgba(204,199,159,0.1)', background: 'rgba(0,0,0,0.15)' }}>
              <p className="text-base font-semibold text-[#ccc79f]">{m.tier}</p>
              <p className="text-xs text-[#f2efe8]/65">{m.items}</p>
              <p className="text-[10px] text-[#95be9a]/70 uppercase tracking-wider">{m.includes}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-[#f2efe8]/35">
          Abono requerido: <strong className="text-[#f2efe8]/55">50% del valor total</strong> para confirmar el evento.
          No se realizan devoluciones de abonos.
        </p>
      </div>

    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-[#ccc79f]/10 flex items-center justify-center text-[#ccc79f]/60 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#f2efe8]/30">{label}</p>
        <p className="text-sm text-[#f2efe8]/75 mt-0.5">{value}</p>
      </div>
    </div>
  )
}
