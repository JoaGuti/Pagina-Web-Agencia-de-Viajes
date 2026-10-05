import { createKuroClient, type KuroClient } from './client';
import { KuroConfigError } from './errors';

/** Única configuración que necesita la web para hablar con Kuro. Ninguna es secreta. */
export function configKuro(env: Record<string, string | undefined> = process.env) {
  const apiUrl = env.KURO_CONTENT_API_URL?.trim();
  const siteKey = env.KURO_SITE_KEY?.trim();
  if (!apiUrl) throw new KuroConfigError('Falta la variable KURO_CONTENT_API_URL.');
  if (!siteKey) throw new KuroConfigError('Falta la variable KURO_SITE_KEY.');
  return { apiUrl, siteKey };
}

/** Origen de la Content API (para la CSP), o null si no está configurada. */
export function origenContentApi(env: Record<string, string | undefined> = process.env): string | null {
  try { return env.KURO_CONTENT_API_URL ? new URL(env.KURO_CONTENT_API_URL).origin : null; } catch { return null; }
}

let cache: { clave: string; cliente: KuroClient } | null = null;
/** Cliente del servidor, creado una vez por configuración. */
export function kuro(): KuroClient {
  const c = configKuro();
  const clave = `${c.apiUrl}|${c.siteKey}`;
  if (!cache || cache.clave !== clave) cache = { clave, cliente: createKuroClient(c) };
  return cache.cliente;
}
