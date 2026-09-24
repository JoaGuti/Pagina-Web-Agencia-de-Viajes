import { z } from 'zod';
import { suscriptores } from '@/lib/db/schema';
import { formularioPublico } from '@/lib/publico';
import { emailValido } from '@/lib/seguridad';

const Suscripcion = z.object({ email: z.string().trim().toLowerCase().max(160).refine(emailValido, 'Revisá el email, parece incompleto.') });

export const POST = formularioPublico('suscripcion', Suscripcion, { max: 5, ventana: 3600 }, async ({ db, datos }) => {
  await db.insert(suscriptores).values({ email: datos.email }).onConflictDoNothing();
  return { ok: true };
});
