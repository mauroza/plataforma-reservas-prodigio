import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const userSelect = {
  id: true, name: true, email: true,
  role: true, active: true, createdAt: true, updatedAt: true,
} as const

// PATCH /api/usuarios/:id — update role or active status (admin only)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }
  if (params.id === session.user.id) {
    return NextResponse.json({ error: 'No puedes modificar tu propia cuenta desde aquí.' }, { status: 400 })
  }

  const body = await req.json()
  const data: Record<string, unknown> = {}

  if ('name' in body) data.name = body.name
  if ('active' in body) data.active = Boolean(body.active)
  if ('role' in body) {
    if (!['admin', 'staff'].includes(body.role)) {
      return NextResponse.json({ error: 'Rol inválido.' }, { status: 400 })
    }
    data.role = body.role
  }

  try {
    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: userSelect,
    })
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 })
  }
}

// DELETE /api/usuarios/:id — delete user (admin only)
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }
  if (params.id === session.user.id) {
    return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta.' }, { status: 400 })
  }

  try {
    await prisma.user.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 })
  }
}
