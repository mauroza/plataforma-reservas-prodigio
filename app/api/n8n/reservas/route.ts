import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { COMBINACIONES, puedeCombinar, clasificarReserva, ABONO_RESERVA } from '@/lib/mesas-config'

function auth(req: Request) {
  return req.headers.get('x-api-key') === process.env.N8N_API_KEY
}

// GET /api/n8n/reservas?telefono=3001234567
// GET /api/n8n/reservas?fecha=2026-05-22
export async function GET(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const telefono = searchParams.get('telefono')
  const fecha    = searchParams.get('fecha')

  const where: Record<string, unknown> = {
    estado: { notIn: ['cancelada', 'finalizada'] },
  }

  if (telefono) where.telefono = telefono.replace(/\D/g, '')
  if (fecha) {
    const inicio = new Date(`${fecha}T00:00:00-05:00`)
    const fin    = new Date(`${fecha}T23:59:59-05:00`)
    where.fechaInicio = { gte: inicio, lte: fin }
  }

  const reservas = await prisma.reservation.findMany({
    where,
    include: {
      tables: { include: { table: { select: { nombre: true, zona: true } } } },
    },
    orderBy: { fechaInicio: 'asc' },
  })

  return NextResponse.json({
    total: reservas.length,
    reservas: reservas.map(r => ({
      id: r.id,
      cliente: r.nombreCliente,
      telefono: r.telefono,
      personas: r.personas,
      fecha: r.fechaInicio.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }),
      hora: r.fechaInicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' }),
      horaFin: r.fechaFin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' }),
      estado: r.estado,
      zona: r.zona,
      mesas: r.tables.map(t => t.table.nombre),
      ocasionEspecial: r.ocasionEspecial ?? null,
      alergenos: r.alergenos ?? null,
      notas: r.notas ?? null,
    })),
  })
}

// POST /api/n8n/reservas  — crear reserva
export async function POST(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()

    const nombreCliente   = String(body.nombreCliente  ?? '')
    const telefono        = String(body.telefono       ?? '')
    const personas        = Number(body.personas)
    const fecha           = String(body.fecha          ?? '')
    const hora            = String(body.hora           ?? '')
    const zona            = body.zona           ? String(body.zona)            : undefined
    const ocasionEspecial = body.ocasionEspecial ? String(body.ocasionEspecial) : undefined
    const alergenos       = body.alergenos       ? String(body.alergenos)       : undefined
    const notas           = body.notas           ? String(body.notas)           : undefined

    if (!nombreCliente || !telefono || !personas || !fecha || !hora) {
      return NextResponse.json({
        error: 'Faltan campos requeridos: nombreCliente, telefono, personas, fecha, hora',
        recibido: { nombreCliente, telefono, personas, fecha, hora },
      }, { status: 400 })
    }

    const tipoReserva = clasificarReserva(personas)

    if (tipoReserva === 'evento') {
      return NextResponse.json({
        esEvento: true,
        personas,
        mensaje: `Para grupos de ${personas} personas manejamos eventos especiales. Se requiere contacto directo con el restaurante para cotización, menú y confirmación.`,
        instrucciones: 'No se crea reserva automática para eventos de 20 o más personas.',
      })
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
      where: {
        activa: true,
        reservable: true,
        id: { notIn: ocupadasIds },
        ...(zona ? { zona } : {}),
      },
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
        fuente:  'ia_whatsapp',
        estado:  'pendiente',
        tables: { create: mesasAsignar.map(m => ({ tableId: m.id })) },
      },
      include: { tables: { include: { table: { select: { nombre: true, zona: true } } } } },
    })

    const nombresM  = reserva.tables.map(t => t.table.nombre).join(' + ')
    const combinadas = mesasAsignar.length > 1

    const respuesta: Record<string, unknown> = {
      success: true,
      tipoReserva,
      mesasCombinadas: combinadas,
      reserva: {
        id:       reserva.id,
        cliente:  reserva.nombreCliente,
        telefono: reserva.telefono,
        personas: reserva.personas,
        fecha:    reserva.fechaInicio.toLocaleDateString('es-CO', { timeZone: 'America/Bogota', weekday: 'long', day: 'numeric', month: 'long' }),
        hora:     reserva.fechaInicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' }),
        horaFin:  reserva.fechaFin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' }),
        mesas:    reserva.tables.map(t => t.table.nombre),
        zona:     reserva.zona,
        estado:   reserva.estado,
      },
      mensaje: combinadas
        ? `Reserva creada para ${nombreCliente} el ${fecha} a las ${hora}. Mesas ${nombresM} unidas para ${personas} personas.`
        : `Reserva creada para ${nombreCliente} el ${fecha} a las ${hora} en mesa ${nombresM}.`,
    }

    if (tipoReserva === 'reserva_abono') {
      respuesta.requiereAbono = true
      respuesta.montoAbono    = ABONO_RESERVA
      respuesta.infoPago = {
        llave: '320 633 9067',
        titular: 'Prodigio Gastro Bar',
      }
      respuesta.mensaje = `${respuesta.mensaje} Se requiere abono de $${ABONO_RESERVA.toLocaleString('es-CO')} COP (Llave: 320 633 9067).`
    }

    return NextResponse.json(respuesta, { status: 201 })

  } catch (err) {
    console.error('[POST /api/n8n/reservas]', err)
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
