import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { destinatariosInternos, enviarEmail, tablaEmail } from '@/lib/avisos';
import { kuro, resumenParaLog } from '@/lib/kuro';
import { formularioPublico } from '@/lib/publico';
import { emailValido } from '@/lib/seguridad';

const Solicitud = z.object({
  nombre: z.string().trim().min(3, 'Escribí tu nombre completo.').max(80),
  dni: z.string().trim().regex(/^[\d.\s]{6,12}$/, 'Revisá el DNI.'),
  email: z.string().trim().toLowerCase().max(120).refine(emailValido, 'Revisá el email, parece incompleto.'),
  reserva: z.string().trim().min(1, 'Indicá el número de reserva o factura.').max(40),
});

/**
 * Sin base de datos propia, la constancia de la solicitud queda en dos lugares independientes:
 *  1. la bandeja de consultas de Kuro (registro persistente, visible para la agencia);
 *  2. emails de constancia al cliente y de aviso a la agencia (si Resend está configurado).
 * Se responde «recibida» solo si al menos uno de los dos registros quedó hecho; si ninguno, es un error
 * y el cliente ve que debe escribir a la agencia (jamás se simula un trámite que no existe).
 */
export const POST = formularioPublico('arrepentimiento', Solicitud, { max: 5, ventana: 3600 }, async ({ datos }) => {
  const codigo = 'AR-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + randomBytes(3).toString('hex').toUpperCase();
  const fecha = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
  const filas: [string, string][] = [['Código', codigo], ['Nombre', datos.nombre], ['DNI', datos.dni], ['Email', datos.email], ['Reserva o factura', datos.reserva], ['Fecha', fecha]];

  const k = kuro();
  const enKuro = k.inquiries.submit(
    {
      name: datos.nombre,
      email: datos.email,
      message: `SOLICITUD DE ARREPENTIMIENTO (botón de la web)\nCódigo de trámite: ${codigo}\nDNI: ${datos.dni}\nReserva o factura: ${datos.reserva}\nFecha: ${fecha}\nPlazo legal: responder dentro de las 24 h con el código de identificación.`,
    },
    { idempotencyKey: `arrepentimiento-${codigo}` },
  ).then(() => true, (e) => { console.error('[arrepentimiento] kuro', resumenParaLog(e)); return false; });

  const porEmail = (async () => {
    const agencia = await k.site.get().then(s => ({ nombre: s.name, email: s.contact.email }), () => null);
    const para = destinatariosInternos(agencia?.email ?? '');
    const enviados = await Promise.all([
      enviarEmail({ para: datos.email, asunto: `Recibimos tu solicitud de arrepentimiento · ${codigo}`, responderA: agencia?.email ?? undefined, html: tablaEmail(`${agencia?.nombre ?? 'La agencia'}: solicitud de arrepentimiento`, filas, 'Guardá este código de trámite. Nos comunicamos con vos a la brevedad.') }),
      para.length ? enviarEmail({ para, asunto: `Solicitud de arrepentimiento ${codigo}`, responderA: datos.email, html: tablaEmail('Solicitud de arrepentimiento desde la web', filas, 'Plazo legal: responder dentro de las 24 h con el código de identificación.') }) : Promise.resolve(false),
    ]);
    return enviados.some(Boolean);
  })();

  const [kuroOk, emailOk] = await Promise.all([enKuro, porEmail]);
  if (!kuroOk && !emailOk) throw new Error('arrepentimiento sin registro');
  return { ok: true, codigo };
});
