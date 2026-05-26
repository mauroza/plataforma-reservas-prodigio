'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { User, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PerfilPage() {
  const { data: session, update } = useSession()

  // Name form
  const [name,        setName]        = useState(session?.user?.name ?? '')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameMsg,     setNameMsg]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Password form
  const [passForm,    setPassForm]    = useState({ current: '', next: '', confirm: '' })
  const [passLoading, setPassLoading] = useState(false)
  const [passMsg,     setPassMsg]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const initials = (session?.user?.name ?? 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    setNameMsg(null)
    setNameLoading(true)
    const res = await fetch('/api/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    setNameLoading(false)
    if (res.ok) {
      await update({ name })
      setNameMsg({ type: 'ok', text: 'Nombre actualizado correctamente.' })
    } else {
      setNameMsg({ type: 'err', text: data.error })
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    setPassMsg(null)
    if (passForm.next !== passForm.confirm) {
      setPassMsg({ type: 'err', text: 'Las contraseñas nuevas no coinciden.' })
      return
    }
    setPassLoading(true)
    const res = await fetch('/api/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: passForm.current, newPassword: passForm.next }),
    })
    const data = await res.json()
    setPassLoading(false)
    if (res.ok) {
      setPassForm({ current: '', next: '', confirm: '' })
      setPassMsg({ type: 'ok', text: 'Contraseña actualizada correctamente.' })
    } else {
      setPassMsg({ type: 'err', text: data.error })
    }
  }

  const role = session?.user?.role === 'admin' ? 'Administrador' : 'Staff'

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">

      {/* ── Avatar + info ───────────────────────────────────────────── */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-hover)] flex items-center justify-center text-2xl font-bold text-[var(--gold)] shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-lg font-semibold text-[#f2efe8]">{session?.user?.name}</p>
          <p className="text-sm text-[#f2efe8]/45 mt-0.5">{session?.user?.email}</p>
          <span className={cn(
            'inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider',
            session?.user?.role === 'admin'
              ? 'bg-[#ccc79f]/12 text-[#ccc79f] border border-[#ccc79f]/20'
              : 'bg-[rgba(255,255,255,0.06)] text-[#f2efe8]/50 border border-[rgba(255,255,255,0.08)]',
          )}>
            {role}
          </span>
        </div>
      </div>

      {/* ── Edit name ───────────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-[#ccc79f]" />
          <h2 className="text-sm font-semibold text-[#f2efe8]">Información personal</h2>
        </div>

        <form onSubmit={saveName} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#f2efe8]/50 tracking-wider uppercase">
              Nombre completo
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              minLength={3}
              className="input-base"
              placeholder="Tu nombre"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#f2efe8]/50 tracking-wider uppercase">
              Correo electrónico
            </label>
            <input
              type="email"
              value={session?.user?.email ?? ''}
              disabled
              className="input-base opacity-40 cursor-not-allowed"
            />
            <p className="text-[10px] text-[#f2efe8]/25">El correo no puede modificarse.</p>
          </div>

          {nameMsg && (
            <Msg type={nameMsg.type} text={nameMsg.text} />
          )}

          <button
            type="submit"
            disabled={nameLoading || name.trim() === (session?.user?.name ?? '')}
            className="btn-gold px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {nameLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando…</> : 'Guardar cambios'}
          </button>
        </form>
      </div>

      {/* ── Change password ─────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-4 h-4 text-[#ccc79f]" />
          <h2 className="text-sm font-semibold text-[#f2efe8]">Cambiar contraseña</h2>
        </div>

        <form onSubmit={savePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#f2efe8]/50 tracking-wider uppercase">
              Contraseña actual
            </label>
            <input
              type="password"
              value={passForm.current}
              onChange={e => setPassForm(p => ({ ...p, current: e.target.value }))}
              required
              className="input-base"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#f2efe8]/50 tracking-wider uppercase">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={passForm.next}
              onChange={e => setPassForm(p => ({ ...p, next: e.target.value }))}
              required
              minLength={8}
              className="input-base"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#f2efe8]/50 tracking-wider uppercase">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              value={passForm.confirm}
              onChange={e => setPassForm(p => ({ ...p, confirm: e.target.value }))}
              required
              className="input-base"
              placeholder="Repite la nueva contraseña"
              autoComplete="new-password"
            />
          </div>

          {passMsg && (
            <Msg type={passMsg.type} text={passMsg.text} />
          )}

          <button
            type="submit"
            disabled={passLoading || !passForm.current || !passForm.next || !passForm.confirm}
            className="btn-gold px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {passLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Actualizando…</> : 'Actualizar contraseña'}
          </button>
        </form>
      </div>

    </div>
  )
}

function Msg({ type, text }: { type: 'ok' | 'err'; text: string }) {
  return (
    <div className={cn(
      'flex items-center gap-2.5 text-sm rounded-lg px-3 py-2.5 border',
      type === 'ok'
        ? 'bg-emerald-400/8 border-emerald-400/20 text-emerald-400'
        : 'bg-[#cf5f56]/8 border-[#cf5f56]/20 text-[#cf5f56]',
    )}>
      {type === 'ok'
        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
        : <AlertCircle className="w-4 h-4 shrink-0" />
      }
      {text}
    </div>
  )
}
