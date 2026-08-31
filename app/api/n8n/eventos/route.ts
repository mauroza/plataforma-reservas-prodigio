import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function auth(req: Request) {
  return req.headers.get('x-api-key') === process.env.N8N_API_KEY
}

// Mismos precios base que dicta el prompt del agente para eventos ≥20 personas.
// Comparación sin tildes: el texto puede llegar con distinta codificación desde n8n/WhatsApp.
function sinTildes(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

const MENU_90K_DISHES = ['lomo saltado', 'salmon a la parrilla', 'chaufa de cerdo']
const MENU_75K_DISHES = ['pollo grill jalisco', 'ensalada de pollo parrillado']

function inferOpcionMenu(input?: string): 'menu_90k' | 'menu_75k' | 'sin_definir' {
  if (!input) return 'sin_definir'
  const v = sinTildes(input.toLowerCase())
  if (MENU_90K_DISHES.some(d => v.includes(d))) return 'menu_90k'
  if (MENU_75K_DISHES.some(d => v.includes(d))) return 'menu_75k'
  return 'sin_definir'
}

// POST /api/n8n/eventos — el agente de WhatsApp genera una cotización de evento (≥20 personas)
// Corresponde a la acción "generar_cotizacion" del tool "Reservas" en n8n (REQ-04).
export async function POST(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()

    const nombreCliente      = String(body.nombreCliente ?? body.empresa ?? '')
    const telefono           = body.telefono ? String(body.telefono) : null
    const personas           = Number(body.personas)
    const fecha               = String(body.fecha       ?? '')
    const horaInicio          = String(body.horaInicio  ?? '')
    const horaFin              = body.horaFin ? String(body.horaFin) : null
    const tipoEvento          = body.tipoEvento ? String(body.tipoEvento) : 'otro'
    const menuSeleccionado    = body.menuSeleccionado ? String(body.menuSeleccionado) : undefined
    const requierePasabocas  = !!body.requierePasabocas
    const requiereLicor      = !!body.requiereLicor
    const notas               = body.notas ? String(body.notas) : undefined

    if (!nombreCliente || !personas || !fecha || !horaInicio) {
      return NextResponse.json({
        error: 'Faltan campos requeridos: nombreCliente, personas, fecha, horaInicio',
        recibido: { nombreCliente, personas, fecha, horaInicio },
      }, { status: 400 })
    }

    if (personas < 20) {
      return NextResponse.json({
        error: `Cotización de eventos es solo para 20 o más personas (llegaron ${personas}). Para grupos menores usá crear_reserva.`,
      }, { status: 400 })
    }

    const inicio = new Date(`${fecha}T${horaInicio}:00-05:00`)
    const fin    = horaFin ? new Date(`${fecha}T${horaFin}:00-05:00`) : new Date(inicio.getTime() + 3 * 60 * 60_000)

    const opcionMenu = inferOpcionMenu(menuSeleccionado)
    const precioPorPersona = opcionMenu === 'menu_90k' ? 90_000 : opcionMenu === 'menu_75k' ? 75_000 : 0
    const montoTotal = precioPorPersona > 0 ? precioPorPersona * personas : null
    const montoAbono = montoTotal ? montoTotal * 0.5 : null

    const necesidades = [
      requierePasabocas ? 'Pasabocas' : null,
      requiereLicor ? 'Licor para brindis' : null,
    ].filter(Boolean).join(', ') || null

    const evento = await prisma.event.create({
      data: {
        nombre: `${tipoEvento} — ${nombreCliente}`,
        empresaPersona: nombreCliente,
        personas,
        fechaInicio: inicio,
        fechaFin: fin,
        tipoEvento,
        opcionMenu,
        estadoPago: 'sin_pago',
        montoTotal,
        montoAbono,
        necesidadesEspeciales: necesidades,
        notas: [telefono ? `Tel: ${telefono}` : null, notas].filter(Boolean).join(' | ') || null,
        estado: 'pendiente',
      },
    })

    const mensaje = montoTotal
      ? `Cotización generada para ${nombreCliente}: ${personas} personas, ${fecha}. Total estimado $${montoTotal.toLocaleString('es-CO')} COP. El equipo la revisará y confirmará por este medio.`
      : `Cotización registrada para ${nombreCliente}: ${personas} personas, ${fecha}. El equipo la revisará y te comparte el total pronto.`

    return NextResponse.json({
      success: true,
      evento: {
        id: evento.id,
        nombre: evento.nombre,
        personas: evento.personas,
        opcionMenu: evento.opcionMenu,
        montoTotal: evento.montoTotal,
        montoAbono: evento.montoAbono,
        estado: evento.estado,
      },
      mensaje,
      requiereAbono: !!montoAbono,
      montoAbono: montoAbono ?? undefined,
      infoPago: montoAbono ? { llave: '320 633 9067', titular: 'Prodigio Gastro Bar' } : undefined,
    }, { status: 201 })

  } catch (err) {
    console.error('[POST /api/n8n/eventos]', err)
    return NextResponse.json({ error: 'Error interno', detalle: String(err) }, { status: 500 })
  }
}
