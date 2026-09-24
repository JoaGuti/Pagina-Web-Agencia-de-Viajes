import { eq } from 'drizzle-orm';
import { registrar } from '@/lib/auth';
import { configuracion } from '@/lib/db/schema';
import { leerConfig } from '@/lib/datos';
import { numero } from '@/lib/formato';
import { leerCuerpo, ruta } from '@/lib/panel/api';
import { Config, urlFoto } from '@/lib/panel/esquemas';
import { z } from 'zod';

export const PUT = ruta('config', async ({ req, u, db }) => {
  const d = await leerCuerpo(req, Config);
  const antes = await leerConfig();
  const datos = { ...antes, ...d };
  await db.update(configuracion).set({ datos, actualizado: new Date() }).where(eq(configuracion.id, 1));
  const cambios = [];
  if (antes.cotizacion !== d.cotizacion) cambios.push(`cambió el dólar de referencia de ARS ${numero(antes.cotizacion)} a ARS ${numero(d.cotizacion)}`);
  if (JSON.stringify(antes.agencia) !== JSON.stringify(d.agencia)) cambios.push('actualizó los datos de la agencia');
  if (JSON.stringify(antes.google) !== JSON.stringify(d.google)) cambios.push('cambió la conexión con Google');
  if (JSON.stringify(antes.resenas) !== JSON.stringify(d.resenas)) cambios.push('actualizó el puntaje de Google');
  if (JSON.stringify(antes.dataFiscal) !== JSON.stringify(d.dataFiscal)) cambios.push('actualizó el QR de Data Fiscal');
  if (cambios.length) await registrar(db, u, cambios.join(' y '));
  return { config: datos };
});

/** Cambia solo el logo (vacío = volver a la marca por defecto). */
export const PATCH = ruta('config', async ({ req, u, db }) => {
  const { logo } = await leerCuerpo(req, z.object({ logo: z.union([z.literal(''), urlFoto]) }));
  const datos = { ...(await leerConfig()), logo };
  await db.update(configuracion).set({ datos, actualizado: new Date() }).where(eq(configuracion.id, 1));
  await registrar(db, u, logo ? 'cambió el logo de la agencia' : 'quitó el logo de la agencia');
  return { config: datos };
});
