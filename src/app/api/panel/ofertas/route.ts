import { eq } from 'drizzle-orm';
import { ErrorHttp, registrar } from '@/lib/auth';
import { ofertas, paquetes } from '@/lib/db/schema';
import { leerCuerpo, ruta } from '@/lib/panel/api';
import { Oferta } from '@/lib/panel/esquemas';

export const POST = ruta('contenido', async ({ req, u, db }) => {
  const d = await leerCuerpo(req, Oferta);
  const [p] = await db.select().from(paquetes).where(eq(paquetes.id, d.paqueteId)).limit(1);
  if (!p) throw new ErrorHttp(400, 'Elegí un paquete que exista.');
  if (d.precioFinal && d.precioFinal >= p.precio) throw new ErrorHttp(400, 'El precio final tiene que ser menor al precio normal.');
  const [o] = await db.insert(ofertas).values(d).returning();
  await registrar(db, u, `creó la oferta "${o.titulo}"`);
  return { oferta: o };
});
