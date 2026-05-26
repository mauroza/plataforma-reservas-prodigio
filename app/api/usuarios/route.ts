import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcryptjs from 'bcryptjs'

const userSelect = {
  id: true, name: true, email: true,
  role: true, active: true, createdAt: true, updatedAt: true,
} as const

// GET /api/usuarios — list all users (admin only)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }
  const users = await prisma.user.findMany({ select: userSelect, orderBy: { createdAt: 'asc' } })
  return NextResponse.json({ users })
}

// POST /api/usuarios — admin creates a user directly
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const { name, email, password, role } = await req.json()
  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'Todos los campos son requeridos.' }, { status: 400 })
  }
  if (!['admin', 'staff'].includes(role)) {
    return NextResponse.json({ error: 'Rol inválido.' }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (exists) {
    return NextResponse.json({ error: 'Este correo ya está registrado.' }, { status: 409 })
  }

  const passwordHash = await bcryptjs.hash(password, 10)
  const user = await prisma.user.create({
    data: { name: name.trim(), email: email.toLowerCase().trim(), password: passwordHash, role },
    select: userSelect,
  })
  return NextResponse.json({ user }, { status: 201 })
}
