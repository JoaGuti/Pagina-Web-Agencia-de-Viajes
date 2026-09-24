import path from 'node:path';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import { sembrar } from './semilla';

export type Db = PostgresJsDatabase<typeof schema>;

const carpetaMigraciones = path.join(process.cwd(), 'drizzle');
let promesa: Promise<Db> | null = null;

export const enProduccion = () => process.env.VERCEL_ENV === 'production' || (process.env.NODE_ENV === 'production' && !!process.env.VERCEL);

async function conectar(): Promise<Db> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  let db: Db;
  if (url) {
    const { default: postgres } = await import('postgres');
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const { migrate } = await import('drizzle-orm/postgres-js/migrator');
    const cliente = postgres(url, { max: 1, prepare: false, idle_timeout: 20, connect_timeout: 15 });
    db = drizzle(cliente, { schema });
    await migrate(db, { migrationsFolder: carpetaMigraciones });
  } else {
    if (process.env.VERCEL) throw new Error('Falta DATABASE_URL: conectá una base Postgres (por ejemplo Neon) al proyecto en Vercel.');
    // Desarrollo local: Postgres embebido, guardado en .data/
    const { PGlite } = await import('@electric-sql/pglite');
    const { drizzle } = await import('drizzle-orm/pglite');
    const { migrate } = await import('drizzle-orm/pglite/migrator');
    const carpeta = path.join(process.cwd(), '.data', 'pglite');
    const { mkdirSync } = await import('node:fs');
    mkdirSync(carpeta, { recursive: true });
    const cliente = new PGlite(carpeta);
    const lite = drizzle(cliente, { schema });
    await migrate(lite, { migrationsFolder: carpetaMigraciones });
    db = lite as unknown as Db;
  }
  await sembrar(db);
  return db;
}

/** Conexión única por instancia; aplica migraciones y datos iniciales la primera vez. */
export function getDb(): Promise<Db> {
  if (!promesa) promesa = conectar().catch(e => { promesa = null; throw e; });
  return promesa;
}

export { schema };
