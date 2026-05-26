'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, CalendarCheck2, PartyPopper, AlertCircle, CheckCheck, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type NotifType = 'reserva' | 'evento' | 'alerta'

interface Notification {
  id: string
  type: NotifType
  title: string
  body: string
  time: string
  read: boolean
}

const ICON: Record<NotifType, React.ElementType> = {
  reserva: CalendarCheck2,
  evento:  PartyPopper,
  alerta:  AlertCircle,
}

const COLOR: Record<NotifType, string> = {
  reserva: 'bg-[rgba(204,199,159,0.12)] text-[var(--gold)]',
  evento:  'bg-purple-400/12 text-purple-400',
  alerta:  'bg-amber-400/12 text-amber-400',
}

export function Notifications() {
  const [open, setOpen]     = useState(false)
  const [items, setItems]   = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  const fetchNotifs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notificaciones')
      if (res.ok) {
        const data = await res.json()
        setItems(data.notificaciones ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount + every 2 minutes
  useEffect(() => {
    fetchNotifs()
    const id = setInterval(fetchNotifs, 2 * 60_000)
    return () => clearInterval(id)
  }, [fetchNotifs])

  // Refetch when panel opens
  useEffect(() => {
    if (open) fetchNotifs()
  }, [open, fetchNotifs])

  const unread = items.filter(n => !n.read).length

  function markAllRead() {
    setItems(prev => prev.map(n => ({ ...n, read: true })))
  }

  function dismiss(id: string) {
    setItems(prev => prev.filter(n => n.id !== id))
  }

  function markRead(id: string) {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative btn-ghost p-2"
        aria-label="Notificaciones"
      >
        {loading && !open
          ? <Loader2 className="w-4 h-4 animate-spin opacity-50" />
          : <Bell className="w-4 h-4" />
        }
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-[var(--coral)] text-white text-[10px] font-bold flex items-center justify-center px-0.5 leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
      )}

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-40 w-80 sm:w-96 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl shadow-black/30 animate-fade-in overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--text-base)]">Notificaciones</h3>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[rgba(207,95,86,0.15)] text-[var(--coral)] text-[10px] font-medium">
                  {unread} nuevas
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[10px] text-[var(--gold)]/70 hover:text-[var(--gold)] transition-colors"
              >
                <CheckCheck className="w-3 h-3" />
                Marcar todas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--text-faint)]" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 text-[var(--text-faint)] mx-auto mb-3" />
                <p className="text-[var(--text-faint)] text-sm">Sin notificaciones</p>
              </div>
            ) : (
              items.map(n => {
                const Icon = ICON[n.type]
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-[var(--border)] group',
                      'hover:bg-[var(--bg-hover)]',
                      !n.read && 'bg-[rgba(204,199,159,0.03)]',
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5', COLOR[n.type])}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-xs font-medium leading-tight', n.read ? 'text-[var(--text-muted)]' : 'text-[var(--text-base)]')}>
                          {n.title}
                        </p>
                        <button
                          onClick={e => { e.stopPropagation(); dismiss(n.id) }}
                          className="opacity-0 group-hover:opacity-100 text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-all shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[10px] text-[var(--text-faint)] mt-0.5 leading-snug">{n.body}</p>
                      <p className="text-[10px] text-[var(--text-faint)] opacity-60 mt-1">{n.time}</p>
                    </div>

                    {!n.read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] shrink-0 mt-1.5" />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="px-4 py-2.5 border-t border-[var(--border)] text-center">
              <button
                onClick={() => setItems([])}
                className="text-[10px] text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"
              >
                Limpiar todo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
