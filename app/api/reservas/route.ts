import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { COMBINACIONES, puedeCombinar, clasificarReserva } from '@/lib/mesas-config'

// POST /api/reservas — crear reserva manual desde el dashboard (staff/admin)
// Réplica de la lógica de asignación de mesas de /api/n8n/reservas, pero
// autenticada por sesión (NextAuth) en vez de x-api-key, y con fuente 'admin'.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()

    const nombreCliente   = String(body.nombreCliente  ?? '')
    const telefono        = String(body.telefono       ?? '')
    const personas        = Number(body.personas)
    const fecha           = String(body.fecha          ?? '')
    const hora            = String(body.hora            ?? '')
    const ocasionEspecial = body.ocasionEspecial ? String(body.ocasionEspecial) : undefined
    const alergenos       = body.alergenos       ? String(body.alergenos)       : undefined
    const notas           = body.notas           ? String(body.notas)           : undefined

    if (!nombreCliente || !telefono || !personas || !fecha || !hora) {
      return NextResponse.json({
        error: 'Faltan campos requeridos: nombreCliente, telefono, personas, fecha, hora',
      }, { status: 400 })
    }

    const tipoReserva = clasificarReserva(personas)

    if (tipoReserva === 'evento') {
      return NextResponse.json({
        error: `Para grupos de ${personas} personas se maneja como evento — usá la sección de Eventos, no Nueva Reserva.`,
      }, { status: 400 })
    }

    const duracionMin  = personas <= 2 ? 90 : personas <= 6 ? 120 : 150
    const BUFFER_MIN   = 15
    const inicio       = new Date(`${fecha}T${hora}:00-05:00`)
    const fin          = new Date(inicio.getTime() + duracionMin * 60_000)
    const finConBuffer = new Date(fin.getTime() + BUFFER_MIN * 60_000)

    const ocupadas = await prisma.reservationTable.findMany({
      where: {
        reservation: {
          estado: { in: ['confirmada', 'pendiente'] },
          AND: [{ fechaInicio: { lt: finConBuffer } }, { fechaFin: { gt: inicio } }],
        },
      },
      select: { tableId: true },
    })
    const ocupadasIds = ocupadas.map(m => m.tableId)

    const mesasLibres = await prisma.table.findMany({
      where: { activa: true, reservable: true, id: { notIn: ocupadasIds } },
      orderBy: { capacidad: 'asc' },
    })

    const libresNombres = new Set(mesasLibres.map(m => m.nombre))
    let mesasAsignar: typeof mesasLibres = []

    const mesaUnica = mesasLibres.find(m => m.capacidad >= personas)
    if (mesaUnica) {
      mesasAsignar = [mesaUnica]
    } else {
      outer: for (const mesa of mesasLibres) {
        const vecinas    = (COMBINACIONES[mesa.nombre] ?? []).filter(n => libresNombres.has(n))
        const candidatos = [mesa.nombre, ...vecinas]
        for (let size = 2; size <= 3; size++) {
          const subsets = getSubsets(candidatos, size).filter(s => s.includes(mesa.nombre))
          for (const subset of subsets) {
            if (!puedeCombinar(subset)) continue
            const seleccion = subset.map(n => mesasLibres.find(m => m.nombre === n)!)
            const total = seleccion.reduce((a, m) => a + m.capacidad, 0)
            if (total >= personas) { mesasAsignar = seleccion; break outer }
          }
        }
      }
    }

    if (mesasAsignar.length === 0) {
      return NextResponse.json({
        error: `No hay disponibilidad para ${personas} personas el ${fecha} a las ${hora}.`,
      }, { status: 409 })
    }

    const reserva = await prisma.reservation.create({
      data: {
        nombreCliente: nombreCliente.trim(),
        telefono:      telefono.replace(/\D/g, ''),
        personas,
        fechaInicio:   inicio,
        fechaFin:      fin,
        zona:          mesasAsignar[0].zona,
        ocasionEspecial: ocasionEspecial ?? null,
        alergenos:       alergenos       ?? null,
        notas:           notas           ?? null,
        fuente:  'admin',
        estado:  'confirmada',
        createdById: session.user.id,
        tables: { create: mesasAsignar.map(m => ({ tableId: m.id })) },
      },
      include: { tables: { include: { table: { select: { nombre: true, zona: true } } } } },
    })

    return NextResponse.json({
      id:             reserva.id,
      nombreCliente:  reserva.nombreCliente,
      telefono:       reserva.telefono,
      personas:       reserva.personas,
      fechaInicio:    reserva.fechaInicio.toISOString(),
      fechaFin:       reserva.fechaFin.toISOString(),
      estado:         reserva.estado,
      zona:           reserva.zona,
      mesas:          reserva.tables.map(t => t.table.nombre),
      ocasionEspecial: reserva.ocasionEspecial ?? undefined,
      alergenos:       reserva.alergenos ?? undefined,
      estadoPago:      reserva.estadoPago,
      notas:           reserva.notas ?? undefined,
      fuente:          reserva.fuente,
      creadaEn:        reserva.createdAt.toISOString(),
    }, { status: 201 })

  } catch (err) {
    console.error('[POST /api/reservas]', err)
    return NextResponse.json({ error: 'Error interno', detalle: String(err) }, { status: 500 })
  }
}

// Genera todos los subconjuntos de tamaño `size` de un arreglo
function getSubsets<T>(arr: T[], size: number): T[][] {
  if (size === 1) return arr.map(x => [x])
  const result: T[][] = []
  for (let i = 0; i <= arr.length - size; i++) {
    const rest = getSubsets(arr.slice(i + 1), size - 1)
    for (const subset of rest) result.push([arr[i], ...subset])
  }
  return result
}
