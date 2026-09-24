import { z } from 'zod';
import { after } from 'next/server';
import { consultas } from '@/lib/db/schema';
import { leerConfig } from '@/lib/datos';
import { destinatariosInternos, enviarEmail, tablaEmail } from '@/lib/avisos';
import { formularioPublico } from '@/lib/publico';
import { emailValido } from '@/lib/seguridad';

const texto = (max: number) => z.string().trim().max(max, 'Uno de los campos es demasiado largo.');
const Consulta = z.object({
  nombre: texto(80).min(3, 'Escribí tu nombre completo.'),
  telefono: texto(30).refine(v => v.replace(/\D/g, '').length >= 8, 'Revisá el teléfono: necesitamos al menos 8 dígitos.'),
  email: texto(120).toLowerCase().refine(emailValido, 'Revisá el email, parece incompleto.'),
  destino: texto(120).optional().default(''),
  fechaViaje: z.string().trim().regex(/^(\d{4}-\d{2})?$/, 'Revisá la fecha de viaje.').optional().default(''),
  mensaje: texto(1500).optional().default(''),
});

export const POST = formularioPublico('consulta', Consulta, { max: 5, ventana: 600 }, async ({ db, datos }) => {
  const [c] = await db.insert(consultas).values(datos).returning();
  after(async () => {
    const cfg = await leerConfig();
    await enviarEmail({
      para: destinatariosInternos(cfg.agencia.email),
      asunto: `Nueva consulta: ${c.nombre}${c.destino && c.destino !== 'Todavía no sé' ? ' · ' + c.destino : ''}`,
      responderA: c.email,
      html: tablaEmail('Nueva consulta desde la web', [['Nombre', c.nombre], ['Teléfono', c.telefono], ['Email', c.email], ['Destino', c.destino], ['Fecha de viaje', c.fechaViaje], ['Mensaje', c.mensaje]], 'Respondé este email para contestarle directamente. También la ves en el panel, sección Consultas.'),
    });
  });
  return { ok: true };
});
