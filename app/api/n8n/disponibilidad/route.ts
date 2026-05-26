import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { COMBINACIONES, puedeCombinar, clasificarReserva, ABONO_RESERVA } from '@/lib/mesas-config'

function auth(req: Request) {
  const key = req.headers.get('x-api-key')
  return key === process.env.N8N_API_KEY
}

// GET /api/n8n/disponibilidad?fecha=2026-05-22&hora=20:00&personas=4
export async function GET(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const fecha    = searchParams.get('fecha')    // YYYY-MM-DD
  const hora     = searchParams.get('hora')     // HH:MM (24h)
  const personas = parseInt(searchParams.get('personas') ?? '2')

  if (!fecha || !hora) {
    return NextResponse.json({ error: 'Parámetros requeridos: fecha (YYYY-MM-DD), hora (HH:MM)' }, { status: 400 })
  }

  // ── Verificar día especial ───────────────────────────────────────────────
  const fechaInicioCOL = new Date(`${fecha}T00:00:00-05:00`)
  const fechaFinCOL    = new Date(`${fecha}T23:59:59-05:00`)
  const diaEspecial = await prisma.specialDay.findFirst({
    where: { fecha: { gte: fechaInicioCOL, lte: fechaFinCOL } },
  })

  if (diaEspecial?.tipo === 'bloqueado_total') {
    return NextResponse.json({
      disponible: false,
      esDiaEspecial: true,
      nombreDia: diaEspecial.nombre,
      mensaje: `El ${fecha} es ${diaEspecial.nombre}. En esa fecha solo recibimos reservas por WhatsApp directo o llamada al restaurante.`,
    })
  }

  // ── Clasificar tipo de solicitud ────────────────────────────────────────
  const tipoReserva = clasificarReserva(personas)

  if (tipoReserva === 'evento') {
    return NextResponse.json({
      disponible: false,
      esEvento: true,
      personas,
      mensaje: `Para grupos de ${personas} personas manejamos eventos especiales. Se requiere contacto directo con el restaurante para cotización y confirmación.`,
    })
  }

  // Calcular duración según personas + buffer de limpieza de 15 min
  const duracionMin = personas <= 2 ? 90 : personas <= 6 ? 120 : 150
  const BUFFER_MIN  = 15
  const inicio = new Date(`${fecha}T${hora}:00-05:00`)  // UTC-5 Colombia
  const fin    = new Date(inicio.getTime() + duracionMin * 60_000)
  const finConBuffer = new Date(fin.getTime() + BUFFER_MIN * 60_000)

  // Horario de cierre: Dom-Mié 22:00, Jue-Sáb 23:00
  const diaSemana = inicio.getDay() // 0=Dom ... 6=Sáb
  const esFinDeSemana = diaSemana >= 4 || diaSemana === 0 // Jue=4, Vie=5, Sáb=6, Dom=0
  const cierreHora = esFinDeSemana ? 23 : 22
  const ultimaReservaHora = cierreHora - 1
  const horaInt = parseInt(hora.split(':')[0])

  if (horaInt >= ultimaReservaHora) {
    return NextResponse.json({
      disponible: false,
      mensaje: `La última reserva los ${esFinDeSemana ? 'jueves a sábados' : 'domingos a miércoles'} es a las ${ultimaReservaHora}:00.`,
    })
  }

  // Mesas ocupadas en ese horario
  const mesasOcupadas = await prisma.reservationTable.findMany({
    where: {
      reservation: {
        estado: { in: ['confirmada', 'pendiente'] },
        AND: [
          { fechaInicio: { lt: finConBuffer } },
          { fechaFin:    { gt: inicio       } },
        ],
      },
    },
    select: { tableId: true },
  })

  const ocupadasIds = mesasOcupadas.map(m => m.tableId)

  const mesasLibres = await prisma.table.findMany({
    where: { activa: true, reservable: true, id: { notIn: ocupadasIds } },
    orderBy: [{ zona: 'asc' }, { nombre: 'asc' }],
  })

  const libresNombres = new Set(mesasLibres.map(m => m.nombre))

  // ── Verificar disponibilidad con reglas físicas del restaurante ──────────
  let requiereCombinacion = false
  let combinacionPosible  = false
  let mesasSugeridas: string[] = []

  const mesaUnica = mesasLibres.find(m => m.capacidad >= personas)
  if (mesaUnica) {
    combinacionPosible = true
    mesasSugeridas = [mesaUnica.nombre]
  } else {
    // Buscar combinación válida usando pares físicos (COMBINACIONES)
    outer: for (const mesa of mesasLibres) {
      const vecinas = (COMBINACIONES[mesa.nombre] ?? []).filter(n => libresNombres.has(n))
      const candidatos = [mesa.nombre, ...vecinas]
      for (let size = 2; size <= 3; size++) {
        const subsets = getSubsets(candidatos, size).filter(s => s.includes(mesa.nombre))
        for (const subset of subsets) {
          if (!puedeCombinar(subset)) continue
          const total = subset.reduce((a, n) => {
            const m = mesasLibres.find(x => x.nombre === n)
            return a + (m?.capacidad ?? 0)
          }, 0)
          if (total >= personas) {
            requiereCombinacion = true
            combinacionPosible  = true
            mesasSugeridas = subset
            break outer
          }
        }
      }
    }
  }

  const horaFinStr = `${fin.getHours().toString().padStart(2,'0')}:${fin.getMinutes().toString().padStart(2,'0')}`

  const respuesta: Record<string, unknown> = {
    disponible: combinacionPosible,
    tipoReserva,
    requiereCombinacion,
    fecha,
    hora,
    horaFin: horaFinStr,
    personas,
    duracionEstimadaMin: duracionMin,
    mesasSugeridas,
    totalMesasLibres: mesasLibres.length,
    mensaje: !combinacionPosible
      ? `No hay disponibilidad para ${personas} personas el ${fecha} a las ${hora}.`
      : requiereCombinacion
        ? `Hay lugar para ${personas} personas uniendo las mesas ${mesasSugeridas.join(' + ')}. La reserva se puede crear.`
        : `Hay disponibilidad en mesa ${mesasSugeridas[0]} para ${personas} personas el ${fecha} a las ${hora}.`,
  }

  if (combinacionPosible && tipoReserva === 'reserva_abono') {
    respuesta.requiereAbono = true
    respuesta.montoAbono = ABONO_RESERVA
    respuesta.infoPago = {
      banco: 'Bancolombia',
      tipoCuenta: 'Ahorros',
      numeroCuenta: '37363488359',
      titular: 'Prodigio Gastro Bar',
      alternativa: 'También puedes solicitar nuestro QR para pagar por Bre-B',
    }
  }

  return NextResponse.json(respuesta)
}

function getSubsets<T>(arr: T[], size: number): T[][] {
  if (size === 1) return arr.map(x => [x])
  const result: T[][] = []
  for (let i = 0; i <= arr.length - size; i++) {
    const rest = getSubsets(arr.slice(i + 1), size - 1)
    for (const subset of rest) result.push([arr[i], ...subset])
  }
  return result
}
