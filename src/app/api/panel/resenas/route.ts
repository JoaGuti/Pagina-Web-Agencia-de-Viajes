import { registrar } from '@/lib/auth';
import { resenas } from '@/lib/db/schema';
import { leerCuerpo, ruta } from '@/lib/panel/api';
import { Resena } from '@/lib/panel/esquemas';

export const POST = ruta('contenido', async ({ req, u, db }) => {
  const d = await leerCuerpo(req, Resena);
  const [r] = await db.insert(resenas).values(d).returning();
  await registrar(db, u, `agregó la reseña de ${r.autor}`);
  return { resena: r };
});
