import { z } from 'zod';
import { after, NextResponse } from 'next/server';
import { consultas } from '@/lib/db/schema';
import { datosSitio, leerConfig, urlBase } from '@/lib/datos';
import { ErrorKuro, enviarConsultaKuro, kuroActivo } from '@/lib/kuro';
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

/** Aviso por email a la agencia (con Resend configurado), con o sin Kuro. */
function avisar(c: z.infer<typeof Consulta>) {
  after(async () => {
    const cfg = await leerConfig();
    await enviarEmail({
      para: destinatariosInternos(cfg.agencia.email),
      asunto: `Nueva consulta: ${c.nombre}${c.destino && c.destino !== 'Todavía no sé' ? ' · ' + c.destino : ''}`,
      responderA: c.email,
      html: tablaEmail('Nueva consulta desde la web', [['Nombre', c.nombre], ['Teléfono', c.telefono], ['Email', c.email], ['Destino', c.destino], ['Fecha de viaje', c.fechaViaje], ['Mensaje', c.mensaje]], `Respondé este email para contestarle directamente. También la ves en ${kuroActivo() ? 'el panel Kuro, sección Mensajes' : 'el panel, sección Consultas'}.`),
    });
  });
}

export const POST = formularioPublico('consulta', Consulta, { max: 5, ventana: 600 }, async ({ db, datos, req }) => {
  if (kuroActivo()) {
    // La consulta va a la bandeja del panel Kuro (con el paquete, si coincide el destino).
    try {
      await enviarConsultaKuro(datos, (await datosSitio()).paquetes, urlBase(req) + '/#contacto');
    } catch (e) {
      if (e instanceof ErrorKuro && (e.codigo === 'KU422' || e.codigo === 'KU429')) return NextResponse.json({ error: e.message }, { status: e.codigo === 'KU429' ? 429 : 400 });
      throw e;
    }
    avisar(datos);
    return { ok: true };
  }
  const [c] = await db.insert(consultas).values(datos).returning();
  avisar(c);
  return { ok: true };
});
