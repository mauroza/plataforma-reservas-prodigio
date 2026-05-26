import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UsuariosView } from '@/components/usuarios/usuarios-view'

export const metadata = { title: 'Usuarios — Prodigio' }

const userSelect = {
  id: true, name: true, email: true,
  role: true, active: true, createdAt: true, updatedAt: true,
} as const

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'admin') {
    redirect('/dashboard')
  }

  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: { createdAt: 'asc' },
  })

  const serialized = users.map(u => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }))

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-[#f2efe8]">Gestión de usuarios</h1>
        <p className="text-[#f2efe8]/40 text-sm mt-1">
          Administra los accesos y roles del equipo Prodigio.
        </p>
      </div>
      <UsuariosView initialUsers={serialized} currentUserId={session.user.id} />
    </div>
  )
}
