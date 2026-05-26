'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <html lang="es">
      <body style={{ margin: 0, background: '#111112', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{
          minHeight: '100vh', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}>
          <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>

            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(207,95,86,0.1)', border: '1px solid rgba(207,95,86,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <AlertTriangle style={{ width: 28, height: 28, color: '#cf5f56' }} />
            </div>

            <p style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#f2efe8', margin: '0 0 8px' }}>
              Error crítico
            </p>
            <p style={{ color: 'rgba(242,239,232,0.4)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
              La aplicación encontró un error grave. Intenta recargar.
            </p>

            {error.message && (
              <p style={{
                color: 'rgba(207,95,86,0.7)', fontSize: 11, fontFamily: 'monospace',
                background: 'rgba(207,95,86,0.05)', border: '1px solid rgba(207,95,86,0.15)',
                borderRadius: 8, padding: '8px 12px', marginBottom: 24,
                textAlign: 'left', wordBreak: 'break-word',
              }}>
                {error.message}
              </p>
            )}

            <button onClick={reset} style={{
              background: '#ccc79f', color: '#0c0c0d',
              border: 'none', borderRadius: 8,
              padding: '10px 24px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              <RefreshCw style={{ width: 16, height: 16 }} />
              Recargar
            </button>

            {error.digest && (
              <p style={{ color: 'rgba(242,239,232,0.15)', fontSize: 10, fontFamily: 'monospace', marginTop: 20 }}>
                ref: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
