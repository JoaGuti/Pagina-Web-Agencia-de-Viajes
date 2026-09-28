import type { NextRequest } from 'next/server';

export function ipDe(req: NextRequest): string {
  const f = req.headers.get('x-forwarded-for');
  return (f ? f.split(',')[0] : req.headers.get('x-real-ip') || 'local').trim();
}

/** Rechaza pedidos que modifican datos si no vienen del mismo sitio (protección CSRF). */
export function origenValido(req: NextRequest): boolean {
  const origen = req.headers.get('origin');
  if (!origen) return req.headers.get('sec-fetch-site') === 'same-origin';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  try { return new URL(origen).host === host; } catch { return false; }
}

export const emailValido = (v: string) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(v);
