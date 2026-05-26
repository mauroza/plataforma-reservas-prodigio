'use client'

import { useState } from 'react'
import { UserPlus, Shield, User, Trash2, Loader2, Eye, EyeOff, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserRow {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  createdAt: string
}

interface Props {
  initialUsers: UserRow[]
  currentUserId: string
}

type RoleFilter = 'all' | 'admin' | 'staff'

export function UsuariosView({ initialUsers, currentUserId }: Props) {
  const [users, setUsers]           = useState<UserRow[]>(initialUsers)
  const [filter, setFilter]         = useState<RoleFilter>('all')
  const [showModal, setShowModal]   = useState(false)
  const [loadingId, setLoadingId]   = useState<string | null>(null)
  const [error, setError]           = useState('')

  // ── Create user modal state ──────────────────────────────────────────
  const [form, setForm]             = useState({ name: '', email: '', password: '', role: 'staff' as 'admin' | 'staff' })
  const [showPass, setShowPass]     = useState(false)
  const [modalError, setModalError] = useState('')
  const [modalLoading, setModalLoading] = useState(false)

  const setField = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const visible = users.filter(u =>
    filter === 'all' ? true : u.role === filter
  )

  // ── Actions ──────────────────────────────────────────────────────────

  async function toggleRole(user: UserRow) {
    const newRole = user.role === 'admin' ? 'staff' : 'admin'
    setLoadingId(user.id)
    setError('')
    const res = await fetch(`/api/usuarios/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    setLoadingId(null)
    if (res.ok) {
      const { user: updated } = await res.json()
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
    } else {
      const data = await res.json()
      setError(data.error ?? 'Error al actualizar el rol.')
    }
  }

  async function toggleActive(user: UserRow) {
    setLoadingId(user.id + '_active')
    setError('')
    const res = await fetch(`/api/usuarios/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !user.active }),
    })
    setLoadingId(null)
    if (res.ok) {
      const { user: updated } = await res.json()
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
    } else {
      const data = await res.json()
      setError(data.error ?? 'Error al actualizar el estado.')
    }
  }

  async function deleteUser(user: UserRow) {
    if (!window.confirm(`¿Eliminar a ${user.name}? Esta acción no se puede deshacer.`)) return
    setLoadingId(user.id + '_del')
    setError('')
    const res = await fetch(`/api/usuarios/${user.id}`, { method: 'DELETE' })
    setLoadingId(null)
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== user.id))
    } else {
      const data = await res.json()
      setError(data.error ?? 'Error al eliminar el usuario.')
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setModalError('')
    if (form.password.length < 8) {
      setModalError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setModalLoading(true)
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setModalLoading(false)
    if (res.ok) {
      const { user } = await res.json()
      setUsers(prev => [...prev, user])
      setShowModal(false)
      setForm({ name: '', email: '', password: '', role: 'staff' })
      setShowPass(false)
    } else {
      const data = await res.json()
      setModalError(data.error ?? 'Error al crear el usuario.')
    }
  }

  const adminCount = users.filter(u => u.role === 'admin').length
  const staffCount = users.filter(u => u.role === 'staff').length
  const activeCount = users.filter(u => u.active).length

  return (
    <div className="space-y-6">

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total usuarios', value: users.length, color: 'text-[#ccc79f]' },
          { label: 'Administradores', value: adminCount, color: 'text-[#d4a96a]' },
          { label: 'Activos', value: activeCount, color: 'text-emerald-400' },
        ].map(stat => (
          <div key={stat.label} className="card p-4">
            <p className="text-[#f2efe8]/45 text-xs uppercase tracking-wider">{stat.label}</p>
            <p className={cn('text-3xl font-semibold mt-1', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-[#0c0c0d] border rounded-lg p-1 w-fit"
             style={{ borderColor: 'rgba(204,199,159,0.1)' }}>
          {(['all', 'admin', 'staff'] as RoleFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                filter === f
                  ? 'bg-[rgba(204,199,159,0.15)] text-[#ccc79f]'
                  : 'text-[#f2efe8]/45 hover:text-[#f2efe8]',
              )}
            >
              {f === 'all' ? `Todos (${users.length})` : f === 'admin' ? `Admin (${adminCount})` : `Staff (${staffCount})`}
            </button>
          ))}
        </div>

        <button
          onClick={() => { setShowModal(true); setModalError('') }}
          className="btn-gold sm:ml-auto flex items-center gap-2 px-4 py-2 text-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Agregar usuario</span>
        </button>
      </div>

      {/* ── Error banner ──────────────────────────────────────────────── */}
      {error && (
        <p className="text-[#cf5f56] text-sm bg-[#cf5f56]/10 border border-[#cf5f56]/25 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* ── Desktop table ─────────────────────────────────────────────── */}
      <div className="card overflow-hidden hidden sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'rgba(204,199,159,0.08)' }}>
              {['Usuario', 'Correo', 'Rol', 'Estado', 'Creado', 'Acciones'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#f2efe8]/40 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(204,199,159,0.06)]">
            {visible.map(user => {
              const isSelf = user.id === currentUserId
              const isRoleLoading   = loadingId === user.id
              const isActiveLoading = loadingId === user.id + '_active'
              const isDelLoading    = loadingId === user.id + '_del'

              return (
                <tr key={user.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#2d2d32] flex items-center justify-center text-xs font-semibold text-[#ccc79f] shrink-0">
                        {user.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[#f2efe8]">{user.name}</p>
                        {isSelf && <p className="text-[10px] text-[#ccc79f]/60">Tú</p>}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-[#f2efe8]/60">{user.email}</td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => !isSelf && toggleRole(user)}
                      disabled={isSelf || isRoleLoading}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                        isSelf ? 'cursor-default' : 'cursor-pointer hover:opacity-80',
                        user.role === 'admin'
                          ? 'bg-[#d4a96a]/15 text-[#d4a96a] border border-[#d4a96a]/25'
                          : 'bg-[rgba(204,199,159,0.08)] text-[#f2efe8]/60 border border-[rgba(204,199,159,0.12)]',
                      )}
                      title={isSelf ? '' : `Cambiar a ${user.role === 'admin' ? 'staff' : 'admin'}`}
                    >
                      {isRoleLoading
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : user.role === 'admin'
                          ? <Shield className="w-3 h-3" />
                          : <User className="w-3 h-3" />
                      }
                      {user.role === 'admin' ? 'Admin' : 'Staff'}
                    </button>
                  </td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => !isSelf && toggleActive(user)}
                      disabled={isSelf || isActiveLoading}
                      className={cn('flex items-center gap-1.5 transition-colors', isSelf ? 'cursor-default' : 'cursor-pointer')}
                      title={isSelf ? '' : user.active ? 'Desactivar' : 'Activar'}
                    >
                      {isActiveLoading
                        ? <Loader2 className="w-4 h-4 animate-spin text-[#f2efe8]/40" />
                        : user.active
                          ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                          : <ToggleLeft className="w-5 h-5 text-[#f2efe8]/25" />
                      }
                      <span className={cn('text-xs', user.active ? 'text-emerald-400' : 'text-[#f2efe8]/35')}>
                        {user.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </button>
                  </td>

                  <td className="px-4 py-3 text-[#f2efe8]/40 text-xs">
                    {new Date(user.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>

                  <td className="px-4 py-3">
                    {!isSelf && (
                      <button
                        onClick={() => deleteUser(user)}
                        disabled={isDelLoading}
                        className="p-1.5 rounded-lg text-[#f2efe8]/30 hover:text-[#cf5f56] hover:bg-[#cf5f56]/10 transition-all disabled:opacity-40"
                        title="Eliminar usuario"
                      >
                        {isDelLoading
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />
                        }
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="text-center py-10 text-[#f2efe8]/35 text-sm">No hay usuarios en esta categoría.</p>
        )}
      </div>

      {/* ── Mobile cards ──────────────────────────────────────────────── */}
      <div className="sm:hidden space-y-3">
        {visible.map(user => {
          const isSelf = user.id === currentUserId
          const isRoleLoading   = loadingId === user.id
          const isActiveLoading = loadingId === user.id + '_active'
          const isDelLoading    = loadingId === user.id + '_del'

          return (
            <div key={user.id} className="card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2d2d32] flex items-center justify-center text-sm font-semibold text-[#ccc79f] shrink-0">
                  {user.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#f2efe8] truncate">{user.name}</p>
                  <p className="text-xs text-[#f2efe8]/45 truncate">{user.email}</p>
                </div>
                {!isSelf && (
                  <button
                    onClick={() => deleteUser(user)}
                    disabled={isDelLoading}
                    className="p-2 rounded-lg text-[#f2efe8]/25 hover:text-[#cf5f56] hover:bg-[#cf5f56]/10 transition-all"
                  >
                    {isDelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => !isSelf && toggleRole(user)}
                  disabled={isSelf || isRoleLoading}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                    isSelf ? 'cursor-default' : 'cursor-pointer hover:opacity-80',
                    user.role === 'admin'
                      ? 'bg-[#d4a96a]/15 text-[#d4a96a] border-[#d4a96a]/25'
                      : 'bg-[rgba(204,199,159,0.08)] text-[#f2efe8]/60 border-[rgba(204,199,159,0.12)]',
                  )}
                >
                  {isRoleLoading
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : user.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />
                  }
                  {user.role === 'admin' ? 'Admin' : 'Staff'}
                </button>

                <button
                  onClick={() => !isSelf && toggleActive(user)}
                  disabled={isSelf || isActiveLoading}
                  className={cn('flex items-center gap-1.5 transition-colors', isSelf ? 'cursor-default' : 'cursor-pointer')}
                >
                  {isActiveLoading
                    ? <Loader2 className="w-4 h-4 animate-spin text-[#f2efe8]/40" />
                    : user.active
                      ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                      : <ToggleLeft className="w-5 h-5 text-[#f2efe8]/25" />
                  }
                  <span className={cn('text-xs', user.active ? 'text-emerald-400' : 'text-[#f2efe8]/35')}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </span>
                </button>

                {isSelf && <span className="text-[10px] text-[#ccc79f]/60 px-2 py-0.5 rounded-full bg-[#ccc79f]/8">Tú</span>}
              </div>
            </div>
          )
        })}
        {visible.length === 0 && (
          <p className="text-center py-10 text-[#f2efe8]/35 text-sm">No hay usuarios en esta categoría.</p>
        )}
      </div>

      {/* ── Create user modal ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
             style={{ background: 'rgba(3,19,8,0.85)' }}>
          <div
            className="w-full max-w-md rounded-2xl border bg-[#111112] p-6 sm:p-7 shadow-2xl"
            style={{ borderColor: 'rgba(204,199,159,0.12)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl text-[#f2efe8]">Agregar usuario</h3>
              <button
                onClick={() => { setShowModal(false); setModalError('') }}
                className="text-[#f2efe8]/35 hover:text-[#f2efe8]/70 transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#f2efe8]/55 tracking-wider uppercase">Nombre completo</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  required
                  minLength={3}
                  className="input-base"
                  placeholder="Nombre del usuario"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#f2efe8]/55 tracking-wider uppercase">Correo electrónico</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setField('email', e.target.value)}
                  required
                  className="input-base"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#f2efe8]/55 tracking-wider uppercase">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setField('password', e.target.value)}
                    required
                    minLength={8}
                    className="input-base pr-10"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f2efe8]/35 hover:text-[#f2efe8]/60 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#f2efe8]/55 tracking-wider uppercase">Rol</label>
                <select
                  value={form.role}
                  onChange={e => setField('role', e.target.value)}
                  className="input-base"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {modalError && (
                <p className="text-[#cf5f56] text-sm bg-[#cf5f56]/10 border border-[#cf5f56]/25 rounded-lg px-3 py-2">
                  {modalError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setModalError('') }}
                  className="btn-outline flex-1 py-2.5 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="btn-gold flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {modalLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando…</> : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
