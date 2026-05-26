'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ErrorType = 'credentials' | 'inactive' | 'network' | null

const ERROR_MESSAGES: Record<NonNullable<ErrorType>, string> = {
  credentials: 'Correo o contraseña incorrectos.',
  inactive:    'Tu cuenta está desactivada. Contacta a un administrador.',
  network:     'No se pudo conectar. Verifica tu conexión e inténtalo de nuevo.',
}

export default function LoginPage() {
  const router = useRouter()
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [errorType, setErrorType] = useState<ErrorType>(null)
  const [shaking,   setShaking]   = useState(false)

  function triggerShake(type: ErrorType) {
    setErrorType(type)
    setShaking(true)
    setTimeout(() => setShaking(false), 400)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorType(null)
    setLoading(true)

    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      setLoading(false)

      if (result?.ok) {
        router.push('/dashboard')
        router.refresh()
      } else if (result?.error === 'AccountInactive') {
        setPassword('')
        triggerShake('inactive')
      } else {
        setPassword('')
        triggerShake('credentials')
      }
    } catch {
      setLoading(false)
      triggerShake('network')
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
          <p className="font-script text-5xl text-[#ccc79f] mb-2 opacity-90 leading-tight">Prodigio</p>
          <h1 className="font-display font-bold tracking-[0.35em] text-[#ccc79f] text-3xl uppercase">PRODIGIO</h1>
          <p className="font-display tracking-[0.5em] text-[#ccc79f]/50 text-xs uppercase mt-1">MANIZALES</p>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#ccc79f]/30" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#ccc79f]/50" />
            <div className="w-2.5 h-2.5 rounded-full border border-[#ccc79f]/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#ccc79f]/50" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#ccc79f]/30" />
          </div>

          <p className="font-serif italic text-[#f2efe8]/70 text-xl leading-relaxed">
            "Gastronomía con propósito"
          </p>
          <p className="mt-8 text-[#f2efe8]/30 text-sm tracking-wide font-sans">Sistema Inteligente de Reservas</p>
        </div>
      </div>

      {/* ── Login form ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 bg-[#111112]">

        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-10">
          <p className="font-script text-4xl text-[#ccc79f]">Prodigio</p>
          <p className="font-display tracking-[0.45em] text-[#ccc79f]/50 text-xs uppercase mt-1">MANIZALES</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-serif text-3xl text-[#f2efe8]">Bienvenido</h2>
            <p className="text-[#f2efe8]/40 text-sm mt-2">Ingresa tus credenciales para acceder al panel</p>
          </div>

          <form onSubmit={handleSubmit} className={cn('space-y-5', shaking && 'shake')}>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#f2efe8]/50 tracking-wider uppercase">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className={cn('input-base', errorType && 'border-[#cf5f56]/40')}
                placeholder="correo@ejemplo.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#f2efe8]/50 tracking-wider uppercase">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className={cn('input-base pr-10', errorType && 'border-[#cf5f56]/40')}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f2efe8]/30 hover:text-[#f2efe8]/60 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorType && (
              <div className="flex items-start gap-2.5 text-[#cf5f56] text-sm bg-[#cf5f56]/8 border border-[#cf5f56]/20 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                <span>{ERROR_MESSAGES[errorType]}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-2.5 text-base disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Iniciando sesión…</>
                : 'Iniciar Sesión'
              }
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#f2efe8]/35">
            ¿No tienes cuenta?{' '}
            <Link href="/registro" className="text-[#ccc79f]/80 hover:text-[#ccc79f] transition-colors">
              Registrarse
            </Link>
          </p>
        </div>

        <p className="mt-12 text-[#f2efe8]/15 text-xs text-center">
          © 2026 Prodigio Manizales · Sistema de Reservas
        </p>
      </div>
    </div>
  )
}
