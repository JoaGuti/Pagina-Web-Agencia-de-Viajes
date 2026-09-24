import { desc } from 'drizzle-orm';
import { registrar } from '@/lib/auth';
import { consultas, suscriptores } from '@/lib/db/schema';
import { ruta } from '@/lib/panel/api';

const celda = (v: unknown) => {
  let s = v instanceof Date ? v.toISOString().replace('T', ' ').slice(0, 16) : String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // evita fórmulas al abrir en Excel
  return `"${s.replace(/"/g, '""')}"`;
};
const csv = (filas: unknown[][]) => '﻿' + filas.map(f => f.map(celda).join(';')).join('\r\n');

/** Descarga de consultas o suscriptores del club en CSV (se abre con Excel). */
export const GET = ruta('consultas', async ({ req, u, db }) => {
  const que = req.nextUrl.searchParams.get('que') === 'suscriptores' ? 'suscriptores' : 'consultas';
  const cuerpo = que === 'suscriptores'
    ? csv([['Email', 'Fecha'], ...(await db.select().from(suscriptores).orderBy(desc(suscriptores.creado))).map(s => [s.email, s.creado])])
    : csv([['Fecha', 'Nombre', 'Teléfono', 'Email', 'Destino', 'Quiere viajar', 'Mensaje', 'Estado'], ...(await db.select().from(consultas).orderBy(desc(consultas.creado))).map(c => [c.creado, c.nombre, c.telefono, c.email, c.destino, c.fechaViaje, c.mensaje, c.estado])]);
  await registrar(db, u, `descargó ${que === 'suscriptores' ? 'los suscriptores del club' : 'las consultas'}`);
  return new Response(cuerpo, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${que}-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store' } });
});
