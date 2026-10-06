import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sincronizarMenuConCluvi } from '@/lib/menu-sync'

export const maxDuration = 60

// POST /api/menu/sync — trae la carta de Cluvi sin pisar los campos propios del dashboard
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const resultado = await sincronizarMenuConCluvi()
    return NextResponse.json({ success: true, ...resultado })
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : 'Error desconocido'
    return NextResponse.json({ error: `No se pudo sincronizar: ${mensaje}` }, { status: 502 })
  }
}
