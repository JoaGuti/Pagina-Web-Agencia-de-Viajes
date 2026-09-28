import { z } from 'zod';
import { NextResponse } from 'next/server';
import { datosSitio, urlBase } from '@/lib/datos';
import { enviarConsultaKuro, errorDeKuro } from '@/lib/kuro';
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

/** La consulta va a la bandeja del panel Kuro (con el paquete, si coincide el destino); Kuro avisa al equipo por correo. */
export const POST = formularioPublico(Consulta, async ({ datos, req }) => {
  try {
    await enviarConsultaKuro(datos, (await datosSitio()).paquetes, urlBase(req) + '/#contacto');
  } catch (e) {
    const r = errorDeKuro(e);
    if (r) return NextResponse.json({ error: r.error }, { status: r.status });
    throw e;
  }
  return { ok: true };
});
