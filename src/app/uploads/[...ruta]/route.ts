import { leerArchivoLocal } from '@/lib/archivos';

const TIPOS: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

/** Sirve las fotos subidas cuando no se usa Vercel Blob (desarrollo o servidor propio). */
export async function GET(_req: Request, { params }: { params: Promise<{ ruta: string[] }> }) {
  const { ruta } = await params;
  const ext = ruta[ruta.length - 1]?.split('.').pop()?.toLowerCase() || '';
  const datos = TIPOS[ext] ? await leerArchivoLocal(ruta) : null;
  if (!datos) return new Response('No encontrado', { status: 404 });
  return new Response(new Uint8Array(datos), { headers: { 'Content-Type': TIPOS[ext], 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' } });
}
