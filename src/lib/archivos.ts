import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ErrorHttp } from './auth';

const carpetaLocal = () => path.join(process.cwd(), '.data', 'uploads');

/** Guarda un archivo público: en Vercel Blob si está configurado, si no en .data/uploads (desarrollo o servidor propio). */
export async function guardarArchivo(ruta: string, datos: Buffer, tipo: string): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const r = await put(ruta, datos, { access: 'public', contentType: tipo, addRandomSuffix: false, cacheControlMaxAge: 31536000 });
    return r.url;
  }
  if (process.env.VERCEL) throw new ErrorHttp(500, 'Falta conectar el almacenamiento de fotos (Vercel Blob) al proyecto.');
  const destino = path.join(carpetaLocal(), ruta);
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, datos);
  return '/uploads/' + ruta;
}

export async function leerArchivoLocal(partes: string[]) {
  if (partes.some(p => !/^[\w.-]+$/.test(p) || p.startsWith('.'))) return null;
  try { return await readFile(path.join(carpetaLocal(), ...partes)); } catch { return null; }
}
