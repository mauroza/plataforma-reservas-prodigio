'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

export default function RegistroPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPass,    setShowPass]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState(false)

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al crear la cuenta.')
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/login'), 3000)
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#0c0c0d]">

      {/* ── Brand panel ───────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden px-16"
        style={{ background: 'linear-gradient(160deg, #0c0c0d 0%, #13120f 60%, #1c1912 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg,#ccc79f 0,#ccc79f 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,#ccc79f 0,#ccc79f 1px,transparent 1px,transparent 60px)',
        }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(204,199,159,0.04)_0%,transparent_70%)]" />

        <div className="relative z-10 text-center max-w-sm">
          <p className="font-script text-5xl text-[#ccc79f] mb-2 leading-tight">Prodigio</p>
          <h1 className="font-display font-bold tracking-[0.35em] text-[#ccc79f] text-3xl uppercase">PRODIGIO</h1>
          <p className="font-display tracking-[0.5em] text-[#ccc79f]/50 text-xs uppercase mt-1">MANIZALES</p>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#ccc79f]/30" />
            <div className="w-2 h-2 rounded-full bg-[#ccc79f]/50" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#ccc79f]/30" />
          </div>

          <p className="font-serif italic text-[#f2efe8]/60 text-lg">Únete al equipo</p>
        </div>
      </div>

      {/* ── Register form ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 bg-[#111112]">

        <div className="lg:hidden text-center mb-8">
          <p className="font-script text-4xl text-[#ccc79f]">Prodigio</p>
          <p className="font-display tracking-[0.45em] text-[#ccc79f]/50 text-xs uppercase mt-1">MANIZALES</p>
        </div>

        <div className="w-full max-w-sm">

          {success ? (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-400/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="font-serif text-2xl text-[#f2efe8]">¡Cuenta creada!</h2>
              <p className="text-[#f2efe8]/40 text-sm">Tu cuenta fue registrada correctamente. Redirigiendo al inicio de sesión…</p>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <h2 className="font-serif text-3xl text-[#f2efe8]">Crear cuenta</h2>
                <p className="text-[#f2efe8]/35 text-sm mt-2">Completa los datos para registrarte</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#f2efe8]/50 tracking-wider uppercase">
                    Nombre completo
                  </label>
                  <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                    required minLength={3} className="input-base" placeholder="Tu nombre" autoComplete="name" />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#f2efe8]/50 tracking-wider uppercase">
                    Correo electrónico
                  </label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    required className="input-base" placeholder="correo@ejemplo.com" autoComplete="email" />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#f2efe8]/50 tracking-wider uppercase">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={form.password}
                      onChange={e => set('password', e.target.value)} required minLength={8}
                      className="input-base pr-10" placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f2efe8]/30 hover:text-[#f2efe8]/60 transition-colors">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#f2efe8]/50 tracking-wider uppercase">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'} value={form.confirm}
                      onChange={e => set('confirm', e.target.value)} required
                      className="input-base pr-10" placeholder="Repite la contraseña" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f2efe8]/30 hover:text-[#f2efe8]/60 transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-[#cf5f56] text-sm bg-[#cf5f56]/8 border border-[#cf5f56]/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button type="submit" disabled={loading}
                        className="btn-gold w-full py-2.5 text-base disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta…</>
                    : 'Crear cuenta'
                  }
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-[#f2efe8]/30">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-[#ccc79f]/80 hover:text-[#ccc79f] transition-colors">
                  Iniciar sesión
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="mt-12 text-[#f2efe8]/15 text-xs text-center">
          © 2026 Prodigio Manizales · Sistema de Reservas
        </p>
      </div>
    </div>
  )
}
