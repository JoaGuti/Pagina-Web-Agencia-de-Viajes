import { and, eq, like, ne, or } from 'drizzle-orm';
import type { Db } from '../db';
import { paquetes } from '../db/schema';
import { slugificar } from '../formato';

/** Dirección única para el paquete: punta-cana, punta-cana-2, … */
export async function slugLibre(db: Db, base: string, excepto?: string) {
  const s = slugificar(base) || 'paquete';
  const usados = new Set((await db.select({ slug: paquetes.slug }).from(paquetes)
    .where(and(or(eq(paquetes.slug, s), like(paquetes.slug, `${s}-%`)), excepto ? ne(paquetes.id, excepto) : undefined))).map(r => r.slug));
  if (!usados.has(s)) return s;
  for (let i = 2; ; i++) if (!usados.has(`${s}-${i}`)) return `${s}-${i}`;
}
