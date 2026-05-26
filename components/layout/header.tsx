'use client'

import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { ChevronDown, LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { Notifications } from '@/components/layout/notifications'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { useState } from 'react'
import { getTodayFormatted } from '@/lib/utils'
import { cn } from '@/lib/utils'

const pageTitles: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/reservas':     'Reservaciones',
  '/mesas':        'Gestión de Mesas',
  '/eventos':      'Eventos',
  '/analiticas':   'Analíticas',
  '/configuracion':'Configuración',
  '/usuarios':     'Usuarios',
  '/perfil':       'Mi Perfil',
}

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [dropOpen, setDropOpen] = useState(false)

  const pageTitle = Object.entries(pageTitles).find(([key]) =>
    key === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(key)
  )?.[1] ?? 'Panel'

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-4 lg:px-6 border-b border-[var(--border)] bg-[var(--bg-base)]">

      {/* Page title */}
      <div>
        <h1 className="font-semibold text-[var(--text-base)] text-base lg:text-lg">{pageTitle}</h1>
        <p className="text-[var(--text-faint)] text-xs capitalize hidden sm:block">
          {getTodayFormatted()}
        </p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Notifications />

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropOpen(v => !v)}
            className="flex items-center gap-2 btn-ghost px-2 py-1.5 rounded-lg"
          >
            <div className="w-7 h-7 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-xs font-semibold text-[var(--gold)]">
              {session?.user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <span className="hidden sm:block text-sm text-[var(--text-muted)] max-w-[100px] truncate">
              {session?.user?.name}
            </span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-[var(--text-faint)] transition-transform', dropOpen && 'rotate-180')} />
          </button>

          {dropOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropOpen(false)} />
              <div className="absolute right-0 top-full mt-2 z-20 w-52 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl shadow-black/30 py-1 animate-fade-in">
                <div className="px-3 py-2.5 border-b border-[var(--border)]">
                  <p className="text-xs font-medium text-[var(--text-base)]">{session?.user?.name}</p>
                  <p className="text-[10px] text-[var(--text-faint)] mt-0.5 capitalize">{session?.user?.role}</p>
                  <p className="text-[10px] text-[var(--text-faint)] opacity-70">{session?.user?.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/perfil"
                    onClick={() => setDropOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-base)] hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    Mi perfil
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--coral)]/70 hover:text-[var(--coral)] hover:bg-[rgba(207,95,86,0.08)] transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
