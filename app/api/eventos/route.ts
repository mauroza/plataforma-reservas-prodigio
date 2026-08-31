import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Mismos precios base que usa el prompt del agente (Salón/Corporativo, ≥20 personas).
// Comparación sin tildes: el texto puede llegar con distinta codificación desde n8n/WhatsApp.
function sinTildes(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

const MENU_90K_DISHES = ['lomo saltado', 'salmon a la parrilla', 'chaufa de cerdo']
const MENU_75K_DISHES = ['pollo grill jalisco', 'ensalada de pollo parrillado']

function inferOpcionMenu(input?: string): 'menu_90k' | 'menu_75k' | 'sin_definir' {
  if (!input) return 'sin_definir'
  const v = sinTildes(input.toLowerCase())
  if (v.includes('90k') || v.includes('90.000') || MENU_90K_DISHES.some(d => v.includes(d))) return 'menu_90k'
  if (v.includes('75k') || v.includes('75.000') || MENU_75K_DISHES.some(d => v.includes(d))) return 'menu_75k'
  return 'sin_definir'
}

function calcularMontos(opcionMenu: 'menu_90k' | 'menu_75k' | 'sin_definir', personas: number) {
  const precioPorPersona = opcionMenu === 'menu_90k' ? 90_000 : opcionMenu === 'menu_75k' ? 75_000 : 0
  const montoTotal = precioPorPersona > 0 ? precioPorPersona * personas : null
  const montoAbono = montoTotal ? montoTotal * 0.5 : null
  return { montoTotal, montoAbono }
}

// POST /api/eventos — crear evento manual desde el dashboard (staff/admin)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()

    const nombre           = String(body.nombre         ?? '')
    const empresaPersona   = String(body.empresaPersona  ?? '')
    const personas         = Number(body.personas)
    const fechaInicio      = String(body.fechaInicio     ?? '')
    const fechaFin         = String(body.fechaFin        ?? '')
    const tipoEvento       = String(body.tipoEvento      ?? 'otro')
    const opcionMenuInput  = body.opcionMenu ? String(body.opcionMenu) : undefined
    const necesidadesEspeciales = body.necesidadesEspeciales ? String(body.necesidadesEspeciales) : undefined
    const notas            = body.notas ? String(body.notas) : undefined

    if (!nombre || !empresaPersona || !personas || !fechaInicio || !fechaFin) {
      return NextResponse.json({
        error: 'Faltan campos requeridos: nombre, empresaPersona, personas, fechaInicio, fechaFin',
      }, { status: 400 })
    }

    const opcionMenu = (opcionMenuInput === 'menu_90k' || opcionMenuInput === 'menu_75k' || opcionMenuInput === 'sin_definir')
      ? opcionMenuInput
      : inferOpcionMenu(opcionMenuInput)

    const { montoTotal, montoAbono } = calcularMontos(opcionMenu, personas)

    const evento = await prisma.event.create({
      data: {
        nombre,
        empresaPersona,
        personas,
        fechaInicio: new Date(fechaInicio),
        fechaFin:    new Date(fechaFin),
        tipoEvento,
        opcionMenu,
        estadoPago: 'sin_pago',
        montoTotal,
        montoAbono,
        necesidadesEspeciales: necesidadesEspeciales ?? null,
        notas: notas ?? null,
        estado: 'pendiente',
      },
    })

    return NextResponse.json({
      id:             evento.id,
      nombre:         evento.nombre,
      empresaPersona: evento.empresaPersona,
      personas:       evento.personas,
      fechaInicio:    evento.fechaInicio.toISOString(),
      fechaFin:       evento.fechaFin.toISOString(),
      tipoEvento:     evento.tipoEvento,
      opcionMenu:     evento.opcionMenu,
      estadoPago:     evento.estadoPago,
      montoTotal:     evento.montoTotal ?? undefined,
      montoAbono:     evento.montoAbono ?? undefined,
      necesidadesEspeciales: evento.necesidadesEspeciales ?? undefined,
      notas:          evento.notas ?? undefined,
      estado:         evento.estado,
      creadaEn:       evento.createdAt.toISOString(),
    }, { status: 201 })

  } catch (err) {
    console.error('[POST /api/eventos]', err)
    return NextResponse.json({ error: 'Error interno', detalle: String(err) }, { status: 500 })
  }
}
