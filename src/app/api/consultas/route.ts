import { z } from 'zod';
import { kuro } from '@/lib/kuro';
import { formularioPublico } from '@/lib/publico';
import { emailValido } from '@/lib/seguridad';

const texto = (max: number) => z.string().trim().max(max, 'Uno de los campos es demasiado largo.');
const Consulta = z.object({
  nombre: texto(80).min(3, 'Escribí tu nombre completo.'),
  telefono: texto(30).refine(v => v.replace(/\D/g, '').length >= 8, 'Revisá el teléfono: necesitamos al menos 8 dígitos.'),
  email: texto(120).toLowerCase().refine(emailValido, 'Revisá el email, parece incompleto.'),
  /** publicId del paquete consultado, si el visitante eligió uno. */
  paquete: texto(80).optional().default(''),
  fechaViaje: z.string().trim().regex(/^(\d{4}-\d{2})?$/, 'Revisá la fecha de viaje.').optional().default(''),
  mensaje: texto(1500).optional().default(''),
  /** Clave de idempotencia generada por el navegador para este envío (evita duplicados al reintentar). */
  clave: z.string().trim().regex(/^[0-9a-f-]{16,64}$/i).optional(),
});

/** La consulta termina en Kuro (Content API v1). Esta web no guarda nada. */
export const POST = formularioPublico('consulta', Consulta, { max: 5, ventana: 600 }, async ({ datos }) => {
  // Solo se envía lo que el visitante realmente escribió o eligió: nada se inventa.
  const mensaje = [datos.mensaje, datos.fechaViaje ? `Fecha de viaje: ${datos.fechaViaje}` : ''].filter(Boolean).join('\n');
  const r = await kuro().inquiries.submit(
    {
      name: datos.nombre,
      email: datos.email,
      phone: datos.telefono,
      message: mensaje || undefined,
      item: datos.paquete ? { kind: 'package', publicId: datos.paquete } : undefined,
    },
    { idempotencyKey: `web-${datos.clave ?? crypto.randomUUID()}` },
  );
  return { ok: true, duplicado: !!r.duplicate };
});
