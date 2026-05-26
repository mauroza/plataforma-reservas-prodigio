'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-[#cf5f56]/10 border border-[#cf5f56]/20 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7 text-[#cf5f56]" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="font-serif text-2xl text-[#f2efe8]">Algo salió mal</h2>
          <p className="text-[#f2efe8]/45 text-sm leading-relaxed">
            Ocurrió un error inesperado al cargar esta sección.
          </p>
          {error.message && (
            <p className="text-[#cf5f56]/70 text-xs font-mono bg-[#cf5f56]/5 border border-[#cf5f56]/15 rounded-lg px-3 py-2 mt-3 text-left break-words">
              {error.message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-gold flex items-center justify-center gap-2 px-5 py-2.5 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
          <a
            href="/dashboard"
            className="btn-outline flex items-center justify-center gap-2 px-5 py-2.5 text-sm"
          >
            <LayoutDashboard className="w-4 h-4" />
            Ir al Dashboard
          </a>
        </div>

        {error.digest && (
          <p className="text-[#f2efe8]/20 text-[10px] font-mono">
            ref: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
