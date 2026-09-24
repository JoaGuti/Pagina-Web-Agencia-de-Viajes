import { eq } from 'drizzle-orm';
import { ErrorHttp, registrar } from '@/lib/auth';
import { paquetes } from '@/lib/db/schema';
import { dinero } from '@/lib/formato';
import { exigirUuid, leerCuerpo, ruta } from '@/lib/panel/api';
import { CambioRapidoPaquete, Paquete } from '@/lib/panel/esquemas';
import { slugLibre } from '@/lib/panel/paquetes';

type P = { id: string };

async function buscar(db: Parameters<Parameters<typeof ruta>[1]>[0]['db'], id: string) {
  const [p] = await db.select().from(paquetes).where(eq(paquetes.id, exigirUuid(id))).limit(1);
  if (!p) throw new ErrorHttp(404, 'Ese paquete ya no existe. Recargá el panel.');
  return p;
}

export const PUT = ruta<P>('contenido', async ({ req, u, db, params }) => {
  const antes = await buscar(db, params.id);
  const d = await leerCuerpo(req, Paquete);
  const slug = d.slug && d.slug !== antes.slug ? await slugLibre(db, d.slug, antes.id) : antes.slug;
  const [p] = await db.update(paquetes).set({ ...d, slug, destino: d.destino || d.nombre, orden: d.orden ?? antes.orden, actualizado: new Date() }).where(eq(paquetes.id, antes.id)).returning();
  const cambios: string[] = [];
  if (antes.precio !== p.precio) cambios.push(`cambió el precio de ${p.nombre} de ${dinero(antes.precio, antes.moneda)} a ${dinero(p.precio, p.moneda)}`);
  if (antes.estado !== p.estado) cambios.push(`${p.estado === 'publicado' ? 'publicó' : p.estado === 'pausado' ? 'pausó' : 'pasó a borrador'} ${p.nombre}`);
  await registrar(db, u, cambios.join(' y ') || `editó ${p.nombre}`);
  return { paquete: p };
});

export const PATCH = ruta<P>('contenido', async ({ req, u, db, params }) => {
  const antes = await buscar(db, params.id);
  const d = await leerCuerpo(req, CambioRapidoPaquete);
  const [p] = await db.update(paquetes).set({ ...d, actualizado: new Date() }).where(eq(paquetes.id, antes.id)).returning();
  if (d.precio !== undefined && d.precio !== antes.precio) await registrar(db, u, `cambió el precio de ${p.nombre} de ${dinero(antes.precio, antes.moneda)} a ${dinero(p.precio, p.moneda)}`);
  if (d.destacado !== undefined && d.destacado !== antes.destacado) await registrar(db, u, `${p.destacado ? 'destacó' : 'quitó de destacados'} ${p.nombre}`);
  if (d.estado && d.estado !== antes.estado) await registrar(db, u, `${p.estado === 'publicado' ? 'publicó' : 'ocultó'} ${p.nombre}`);
  return { paquete: p };
});

export const DELETE = ruta<P>('contenido', async ({ u, db, params }) => {
  const p = await buscar(db, params.id);
  await db.delete(paquetes).where(eq(paquetes.id, p.id));
  await registrar(db, u, `eliminó el paquete ${p.nombre}`);
  return { ok: true };
});
