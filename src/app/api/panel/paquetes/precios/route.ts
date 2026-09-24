import { eq, inArray } from 'drizzle-orm';
import { ErrorHttp, registrar } from '@/lib/auth';
import { paquetes } from '@/lib/db/schema';
import { leerCuerpo, ruta } from '@/lib/panel/api';
import { PreciosEnBloque } from '@/lib/panel/esquemas';

/** Aumento o rebaja porcentual de precios de varios paquetes a la vez. */
export const POST = ruta('contenido', async ({ req, u, db }) => {
  const d = await leerCuerpo(req, PreciosEnBloque);
  const lista = d.ids?.length ? await db.select().from(paquetes).where(inArray(paquetes.id, d.ids))
    : d.region && d.region !== 'all' ? await db.select().from(paquetes).where(eq(paquetes.region, d.region))
      : await db.select().from(paquetes);
  if (!lista.length) throw new ErrorHttp(400, 'No hay paquetes en esta selección.');
  const f = 1 + d.porcentaje / 100;
  const r = (v: number) => (v > 0 ? Math.max(1, Math.round(v * f / d.redondeo) * d.redondeo) : 0);
  const actualizados = await db.transaction(async tx => Promise.all(lista.map(p => tx.update(paquetes).set({
    precio: r(p.precio), precioSingle: r(p.precioSingle), precioTriple: r(p.precioTriple), precioMenor: r(p.precioMenor), actualizado: new Date(),
  }).where(eq(paquetes.id, p.id)).returning().then(x => x[0]))));
  await registrar(db, u, `actualizó ${lista.length} precio${lista.length === 1 ? '' : 's'} un ${d.porcentaje > 0 ? '+' : ''}${String(d.porcentaje).replace('.', ',')} %`);
  return { paquetes: actualizados };
});
