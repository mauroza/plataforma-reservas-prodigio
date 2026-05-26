'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, CalendarRange, LayoutGrid,
  PartyPopper, TrendingUp, Settings, LogOut, UsersRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard',      href: '/dashboard',     icon: LayoutDashboard, adminOnly: false },
  { label: 'Reservaciones',  href: '/reservas',      icon: CalendarRange,   adminOnly: false },
  { label: 'Mesas',          href: '/mesas',         icon: LayoutGrid,      adminOnly: false },
  { label: 'Eventos',        href: '/eventos',       icon: PartyPopper,     adminOnly: false },
  { label: 'Analíticas',     href: '/analiticas',    icon: TrendingUp,      adminOnly: false },
  { label: 'Usuarios',       href: '/usuarios',      icon: UsersRound,      adminOnly: true  },
  { label: 'Configuración',  href: '/configuracion', icon: Settings,        adminOnly: false },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen z-40',
      'hidden md:flex flex-col',
      'w-16 lg:w-60',
      'bg-[var(--bg-sidebar)] border-r border-[var(--border)]',
    )}>

      {/* ── Logo ────────────────────────────────────────────────────── */}
      <div className="h-16 flex items-center px-4 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-[var(--gold)] flex items-center justify-center">
            <span className="font-display font-bold text-[var(--bg-sidebar)] text-sm leading-none">P</span>
          </div>
          <div className="hidden lg:block min-w-0">
            <p className="font-display font-semibold tracking-[0.3em] text-[var(--gold)] text-xs uppercase">
              PRODIGIO
            </p>
            <p className="text-[var(--text-base)] opacity-25 text-[10px] tracking-[0.4em] uppercase">
              MANIZALES
            </p>
          </div>
        </div>
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.filter(item => !item.adminOnly || isAdmin).map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center rounded-lg py-2.5 transition-all duration-150 group',
                'justify-center lg:justify-start',
                'px-2 lg:px-3',
                active
                  ? 'bg-[rgba(var(--gold-rgb,204,199,159),0.10)] text-[var(--gold)] lg:border-l-2 lg:border-[var(--gold)] lg:pl-[10px]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-base)] hover:bg-[var(--bg-hover)]',
              )}
              title={item.label}
            >
              <item.icon className={cn('w-[18px] h-[18px] shrink-0', active ? 'text-[var(--gold)]' : '')} />
              <span className={cn(
                'hidden lg:block ml-3 text-sm font-medium',
                active ? 'text-[var(--gold)]' : '',
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* ── User ────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-[var(--border)] p-3">
        {session?.user && (
          <div className="hidden lg:flex items-center gap-2.5 mb-2 px-1">
            <div className="w-7 h-7 shrink-0 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-xs font-semibold text-[var(--gold)]">
              {session.user.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--text-base)] truncate">{session.user.name}</p>
              <p className="text-[10px] text-[var(--text-faint)] capitalize">{session.user.role}</p>
            </div>
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={cn(
            'w-full flex items-center rounded-lg py-2.5 transition-all duration-150',
            'justify-center lg:justify-start',
            'px-2 lg:px-3',
            'text-[var(--text-faint)] hover:text-[var(--coral)] hover:bg-[rgba(207,95,86,0.08)]',
          )}
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="hidden lg:block ml-3 text-sm">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
