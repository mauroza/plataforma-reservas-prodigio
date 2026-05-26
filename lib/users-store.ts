/**
 * In-memory user store for development/demo.
 * Replace calls to this module with Prisma queries when DATABASE_URL is set.
 * NOTE: In serverless environments (Vercel) state resets per invocation — use the DB.
 */

import bcryptjs from 'bcryptjs'

export interface AppUser {
  id: string
  name: string
  email: string
  passwordHash: string
  role: 'admin' | 'staff'
  active: boolean
  createdAt: string
}

export type PublicUser = Omit<AppUser, 'passwordHash'>

// Seeded at module init — one default admin until DB is connected
const _store: AppUser[] = [
  {
    id: 'usr_admin_01',
    name: 'Administrador Prodigio',
    email: 'admin@prodigio.co',
    passwordHash: bcryptjs.hashSync('Admin123!', 10),
    role: 'admin',
    active: true,
    createdAt: '2026-01-01T00:00:00',
  },
]

function toPublic(u: AppUser): PublicUser {
  const { passwordHash: _, ...pub } = u
  return pub
}

export const usersStore = {
  getAll(): PublicUser[] {
    return _store.map(toPublic)
  },

  getByEmail(email: string): AppUser | undefined {
    return _store.find(u => u.email.toLowerCase() === email.toLowerCase())
  },

  getById(id: string): AppUser | undefined {
    return _store.find(u => u.id === id)
  },

  emailExists(email: string): boolean {
    return _store.some(u => u.email.toLowerCase() === email.toLowerCase())
  },

  add(data: { name: string; email: string; passwordHash: string; role: 'admin' | 'staff' }): PublicUser {
    const user: AppUser = {
      ...data,
      id: `usr_${Date.now()}`,
      active: true,
      createdAt: new Date().toISOString(),
    }
    _store.push(user)
    return toPublic(user)
  },

  update(id: string, updates: Partial<Pick<AppUser, 'name' | 'role' | 'active'>>): PublicUser | null {
    const idx = _store.findIndex(u => u.id === id)
    if (idx === -1) return null
    Object.assign(_store[idx], updates)
    return toPublic(_store[idx])
  },

  remove(id: string): boolean {
    const idx = _store.findIndex(u => u.id === id)
    if (idx === -1) return false
    _store.splice(idx, 1)
    return true
  },
}
