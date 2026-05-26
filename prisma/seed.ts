import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

const admins = [
  { name: 'Jorge Cardenas', email: 'jorgecardenas11a@gmail.com', password: 'vegetta123' },
]

// Mesas reales del restaurante — según documento oficial
const tables = [
  // ── Salón Interno — mesas M (bajitas) ────────────────────────────────────
  { nombre: 'M1',  capacidad: 4, zona: 'salon_interno', tipo: 'M', reservable: true  },
  { nombre: 'M2',  capacidad: 4, zona: 'salon_interno', tipo: 'M', reservable: true  },
  { nombre: 'M3',  capacidad: 4, zona: 'salon_interno', tipo: 'M', reservable: true  },
  { nombre: 'M4',  capacidad: 4, zona: 'salon_interno', tipo: 'M', reservable: true  },
  { nombre: 'M5',  capacidad: 4, zona: 'salon_interno', tipo: 'M', reservable: true  },
  { nombre: 'M6',  capacidad: 5, zona: 'salon_interno', tipo: 'M', reservable: true  },
  { nombre: 'M7',  capacidad: 3, zona: 'salon_interno', tipo: 'M', reservable: true  },
  { nombre: 'M8',  capacidad: 4, zona: 'salon_interno', tipo: 'M', reservable: true  },
  { nombre: 'M9',  capacidad: 4, zona: 'salon_interno', tipo: 'M', reservable: true  },
  { nombre: 'M10', capacidad: 4, zona: 'salon_interno', tipo: 'M', reservable: true  },

  // ── Terraza — mesas T (altas) ─────────────────────────────────────────────
  { nombre: 'T11', capacidad: 3, zona: 'terraza', tipo: 'T', reservable: true  },
  { nombre: 'T12', capacidad: 3, zona: 'terraza', tipo: 'T', reservable: true  },
  { nombre: 'T13', capacidad: 3, zona: 'terraza', tipo: 'T', reservable: true  },
  { nombre: 'T14', capacidad: 4, zona: 'terraza', tipo: 'T', reservable: false }, // no se reserva sola; se une a T11 para grupos
  { nombre: 'T15', capacidad: 6, zona: 'terraza', tipo: 'T', reservable: true  },
  { nombre: 'T16', capacidad: 3, zona: 'terraza', tipo: 'T', reservable: true  },
  { nombre: 'T17', capacidad: 3, zona: 'terraza', tipo: 'T', reservable: true  },
]

async function main() {
  // Usuarios admin
  for (const admin of admins) {
    const hash = await bcryptjs.hash(admin.password, 10)
    await prisma.user.upsert({
      where:  { email: admin.email },
      update: { name: admin.name, role: 'admin', active: true },
      create: { name: admin.name, email: admin.email, password: hash, role: 'admin', active: true },
    })
    console.log(`✓ Admin: ${admin.email}`)
  }

  // Mesas
  for (const t of tables) {
    await prisma.table.upsert({
      where:  { nombre: t.nombre },
      update: { capacidad: t.capacidad, zona: t.zona, tipo: t.tipo, reservable: t.reservable, activa: true },
      create: { ...t, activa: true },
    })
    console.log(`✓ Mesa: ${t.nombre} (${t.capacidad}p, ${t.zona})`)
  }

  console.log('\n✅ Seed completo — 1 admin, 17 mesas.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
