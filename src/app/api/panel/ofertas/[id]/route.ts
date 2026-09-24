import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { ErrorHttp, registrar } from '@/lib/auth';
import { ofertas, paquetes } from '@/lib/db/schema';
import { exigirUuid, leerCuerpo, ruta } from '@/lib/panel/api';
import { Oferta } from '@/lib/panel/esquemas';

type P = { id: string };
async function buscar(db: Parameters<Parameters<typeof ruta>[1]>[0]['db'], id: string) {
  const [o] = await db.select().from(ofertas).where(eq(ofertas.id, exigirUuid(id))).limit(1);
  if (!o) throw new ErrorHttp(404, 'Esa oferta ya no existe. Recargá el panel.');
  return o;
}

export const PUT = ruta<P>('contenido', async ({ req, u, db, params }) => {
  const antes = await buscar(db, params.id);
  const d = await leerCuerpo(req, Oferta);
  const [p] = await db.select().from(paquetes).where(eq(paquetes.id, d.paqueteId)).limit(1);
  if (!p) throw new ErrorHttp(400, 'Elegí un paquete que exista.');
  if (d.precioFinal && d.precioFinal >= p.precio) throw new ErrorHttp(400, 'El precio final tiene que ser menor al precio normal.');
  const [o] = await db.update(ofertas).set(d).where(eq(ofertas.id, antes.id)).returning();
  await registrar(db, u, `editó la oferta "${o.titulo}"`);
  return { oferta: o };
});

export const PATCH = ruta<P>('contenido', async ({ req, u, db, params }) => {
  const antes = await buscar(db, params.id);
  const { activa } = await leerCuerpo(req, z.object({ activa: z.boolean() }));
  const [o] = await db.update(ofertas).set({ activa }).where(eq(ofertas.id, antes.id)).returning();
  await registrar(db, u, `${activa ? 'encendió' : 'apagó'} la oferta "${o.titulo}"`);
  return { oferta: o };
});

export const DELETE = ruta<P>('contenido', async ({ u, db, params }) => {
  const o = await buscar(db, params.id);
  await db.delete(ofertas).where(eq(ofertas.id, o.id));
  await registrar(db, u, `eliminó la oferta "${o.titulo}"`);
  return { ok: true };
});
