import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111112] px-6">
      <div className="max-w-sm w-full text-center space-y-6">

        <div className="relative">
          <p className="font-display font-bold text-[120px] leading-none text-[#f2efe8]/5 select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="font-display font-bold tracking-[0.35em] text-[#ccc79f] text-lg uppercase">
                PRODIGIO
              </p>
              <p className="font-display tracking-[0.5em] text-[#ccc79f]/40 text-[10px] uppercase mt-0.5">
                MANIZALES
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#f2efe8]/10" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#ccc79f]/30" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#f2efe8]/10" />
        </div>

        <div className="space-y-2">
          <h2 className="font-serif text-2xl text-[#f2efe8]">Página no encontrada</h2>
          <p className="text-[#f2efe8]/35 text-sm leading-relaxed">
            La sección que buscas no existe o fue movida.
          </p>
        </div>

        <Link href="/dashboard" className="btn-gold inline-flex items-center gap-2 px-6 py-2.5 text-sm">
          <LayoutDashboard className="w-4 h-4" />
          Volver al Dashboard
        </Link>

        <p className="text-[#f2efe8]/15 text-xs">
          © 2026 Prodigio Manizales · Sistema de Reservas
        </p>
      </div>
    </div>
  )
}
