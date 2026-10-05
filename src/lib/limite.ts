/**
 * Límite de envíos por conexión, en memoria de cada instancia. Es una ayuda del frontend contra
 * ráfagas (no hay base de datos propia): la autoridad final del rate limiting es la Content API de Kuro.
 */
const ventanas = new Map<string, { n: number; desde: number }>();

export function dentroDelLimite(clave: string, maximo: number, ventanaSeg: number, ahora = Date.now()): boolean {
  if (ventanas.size > 5000) for (const [k, v] of ventanas) if (ahora - v.desde > ventanaSeg * 1000) ventanas.delete(k);
  const v = ventanas.get(clave);
  if (!v || ahora - v.desde > ventanaSeg * 1000) { ventanas.set(clave, { n: 1, desde: ahora }); return true; }
  v.n++;
  return v.n <= maximo;
}
