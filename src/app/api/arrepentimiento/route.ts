import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { arrepentimientos } from '@/lib/db/schema';
import { leerConfig } from '@/lib/datos';
import { destinatariosInternos, enviarEmail, tablaEmail } from '@/lib/avisos';
import { formularioPublico } from '@/lib/publico';
import { emailValido } from '@/lib/seguridad';

const Solicitud = z.object({
  nombre: z.string().trim().min(3, 'Escribí tu nombre completo.').max(80),
  dni: z.string().trim().regex(/^[\d.\s]{6,12}$/, 'Revisá el DNI.'),
  email: z.string().trim().toLowerCase().max(120).refine(emailValido, 'Revisá el email, parece incompleto.'),
  reserva: z.string().trim().min(1, 'Indicá el número de reserva o factura.').max(40),
});

export const POST = formularioPublico('arrepentimiento', Solicitud, { max: 5, ventana: 3600 }, async ({ db, datos }) => {
  const codigo = 'AR-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + randomBytes(3).toString('hex').toUpperCase();
  await db.insert(arrepentimientos).values({ ...datos, codigo });
  const cfg = await leerConfig();
  const filas: [string, string][] = [['Código', codigo], ['Nombre', datos.nombre], ['DNI', datos.dni], ['Email', datos.email], ['Reserva o factura', datos.reserva], ['Fecha', new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Cordoba' })]];
  // Constancia para el cliente (Res. 424/2020) y aviso para la agencia
  await Promise.all([
    enviarEmail({ para: datos.email, asunto: `Recibimos tu solicitud de arrepentimiento · ${codigo}`, responderA: cfg.agencia.email, html: tablaEmail(`${cfg.agencia.nombre}: solicitud de arrepentimiento`, filas, 'Guardá este código de trámite. Nos comunicamos con vos a la brevedad.') }),
    enviarEmail({ para: destinatariosInternos(cfg.agencia.email), asunto: `Solicitud de arrepentimiento ${codigo}`, responderA: datos.email, html: tablaEmail('Solicitud de arrepentimiento desde la web', filas, 'Plazo legal: responder dentro de las 24 h con el código de identificación.') }),
  ]);
  return { ok: true, codigo };
});
