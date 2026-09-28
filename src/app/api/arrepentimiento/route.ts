import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { datosSitio, urlBase } from '@/lib/datos';
import { enviarEmail, tablaEmail } from '@/lib/avisos';
import { enviarAvisoKuro, errorDeKuro } from '@/lib/kuro';
import { formularioPublico } from '@/lib/publico';
import { emailValido } from '@/lib/seguridad';

const Solicitud = z.object({
  nombre: z.string().trim().min(3, 'Escribí tu nombre completo.').max(80),
  dni: z.string().trim().regex(/^[\d.\s]{6,12}$/, 'Revisá el DNI.'),
  email: z.string().trim().toLowerCase().max(120).refine(emailValido, 'Revisá el email, parece incompleto.'),
  reserva: z.string().trim().min(1, 'Indicá el número de reserva o factura.').max(40),
});

/**
 * Botón de arrepentimiento (Res. 424/2020): la solicitud llega a la bandeja
 * de Kuro con su código de trámite, que se muestra en pantalla. Si hay
 * RESEND_API_KEY, además se le manda la constancia por correo a quien la pidió.
 */
export const POST = formularioPublico(Solicitud, async ({ datos, req }) => {
  const codigo = 'AR-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + randomBytes(3).toString('hex').toUpperCase();
  const fecha = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
  const filas: [string, string][] = [['Código', codigo], ['Nombre', datos.nombre], ['DNI', datos.dni], ['Email', datos.email], ['Reserva o factura', datos.reserva], ['Fecha', fecha]];
  try {
    await enviarAvisoKuro({
      nombre: datos.nombre,
      email: datos.email,
      mensaje: `SOLICITUD DE ARREPENTIMIENTO (Res. 424/2020). Plazo legal: responder dentro de las 24 h con el código.\n\n${filas.map(([k, v]) => `${k}: ${v}`).join('\n')}`,
    }, urlBase(req) + '/arrepentimiento');
  } catch (e) {
    const r = errorDeKuro(e);
    if (r) return NextResponse.json({ error: r.error }, { status: r.status });
    throw e;
  }
  const { cfg } = await datosSitio().catch(() => ({ cfg: null }));
  if (cfg) await enviarEmail({ para: datos.email, asunto: `Recibimos tu solicitud de arrepentimiento · ${codigo}`, responderA: cfg.agencia.email || undefined, html: tablaEmail(`${cfg.agencia.nombre}: solicitud de arrepentimiento`, filas, 'Guardá este código de trámite. Nos comunicamos con vos a la brevedad.') });
  return { ok: true, codigo };
});
