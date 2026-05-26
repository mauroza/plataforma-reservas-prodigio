'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarRange, LayoutGrid, PartyPopper, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { label: 'Inicio',     href: '/dashboard',  icon: LayoutDashboard },
  { label: 'Reservas',   href: '/reservas',   icon: CalendarRange   },
  { label: 'Mesas',      href: '/mesas',      icon: LayoutGrid      },
  { label: 'Eventos',    href: '/eventos',    icon: PartyPopper     },
  { label: 'Analíticas', href: '/analiticas', icon: TrendingUp      },
]

export function MobileNav() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--bg-sidebar)]"
    >
      <div className="flex items-stretch">
        {items.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-center gap-1 py-3 px-1',
                'text-[10px] font-medium transition-colors duration-150',
                active
                  ? 'text-[var(--gold)]'
                  : 'text-[var(--text-faint)] hover:text-[var(--text-base)]',
              )}
            >
              <span className={cn(
                'absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full transition-opacity',
                active ? 'opacity-100 bg-[var(--gold)]' : 'opacity-0',
              )} />
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
    </nav>
  )
}
