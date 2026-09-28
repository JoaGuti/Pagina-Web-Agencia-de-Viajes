import { z } from 'zod';
import { NextResponse } from 'next/server';
import { urlBase } from '@/lib/datos';
import { enviarAvisoKuro, errorDeKuro } from '@/lib/kuro';
import { formularioPublico } from '@/lib/publico';
import { emailValido } from '@/lib/seguridad';

const Suscripcion = z.object({ email: z.string().trim().toLowerCase().max(160).refine(emailValido, 'Revisá el email, parece incompleto.') });

/** Club de ofertas: el email llega a la bandeja de Kuro (queda como contacto) para mandarle las ofertas. */
export const POST = formularioPublico(Suscripcion, async ({ datos, req }) => {
  try {
    await enviarAvisoKuro({ nombre: datos.email.split('@')[0], email: datos.email, mensaje: 'Se sumó al club de ofertas desde la web: quiere recibir las ofertas de último minuto.' }, urlBase(req) + '/#club');
  } catch (e) {
    const r = errorDeKuro(e);
    if (r) return NextResponse.json({ error: r.error }, { status: r.status });
    throw e;
  }
  return { ok: true };
});
