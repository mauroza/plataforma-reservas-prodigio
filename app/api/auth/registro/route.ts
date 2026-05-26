import { NextResponse } from 'next/server'
import bcryptjs from 'bcryptjs'
import { prisma } from '@/lib/db'

const userSelect = {
  id: true, name: true, email: true,
  role: true, active: true, createdAt: true, updatedAt: true,
} as const

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'Todos los campos son requeridos.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 })
    }

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (exists) {
      return NextResponse.json({ error: 'Este correo ya está registrado.' }, { status: 409 })
    }

    const passwordHash = await bcryptjs.hash(password, 10)
    const user = await prisma.user.create({
      data: { name: name.trim(), email: email.toLowerCase().trim(), password: passwordHash, role: 'staff' },
      select: userSelect,
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
