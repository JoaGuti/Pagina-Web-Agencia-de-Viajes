import { sql } from 'drizzle-orm';
import { registrar } from '@/lib/auth';
import { paquetes } from '@/lib/db/schema';
import { ruta, leerCuerpo } from '@/lib/panel/api';
import { Paquete } from '@/lib/panel/esquemas';
import { slugLibre } from '@/lib/panel/paquetes';

export const POST = ruta('contenido', async ({ req, u, db }) => {
  const d = await leerCuerpo(req, Paquete);
  const slug = await slugLibre(db, d.slug || d.nombre);
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${paquetes.orden}), 0)::int` }).from(paquetes);
  const [p] = await db.insert(paquetes).values({ ...d, slug, destino: d.destino || d.nombre, orden: d.orden ?? max + 1 }).returning();
  await registrar(db, u, `creó el paquete ${p.nombre}${p.estado === 'publicado' ? ' y lo publicó' : ''}`);
  return { paquete: p };
});
