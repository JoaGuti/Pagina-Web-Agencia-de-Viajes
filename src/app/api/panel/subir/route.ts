import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { ErrorHttp, puede, requerir, respuestaError } from '@/lib/auth';
import { guardarArchivo } from '@/lib/archivos';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * Recibe una imagen (el panel ya la achica en el navegador para no superar el límite de 4,5 MB de Vercel),
 * la vuelve a codificar (lo que además elimina datos ocultos y metadatos) y la guarda.
 * Fotos de paquetes: versión de 1600 px y de 800 px. Logo y QR: PNG transparente.
 */
export async function POST(req: NextRequest) {
  try {
    const u = await requerir(req);
    const form = await req.formData().catch(() => { throw new ErrorHttp(400, 'No llegó ninguna imagen.'); });
    const archivo = form.get('archivo'), tipo = String(form.get('tipo') || 'foto');
    if (!(archivo instanceof File)) throw new ErrorHttp(400, 'No llegó ninguna imagen.');
    if (!['foto', 'logo', 'qr'].includes(tipo)) throw new ErrorHttp(400, 'Tipo de imagen desconocido.');
    if (!puede(u, tipo === 'foto' ? 'contenido' : 'config')) throw new ErrorHttp(403, 'Tu usuario no tiene permiso para esto.');
    if (archivo.size > 4.4 * 1024 * 1024) throw new ErrorHttp(413, 'La imagen pesa demasiado. Probá con una más liviana.');
    const entrada = Buffer.from(await archivo.arrayBuffer());
    const img = sharp(entrada, { limitInputPixels: 60_000_000, failOn: 'error' });
    const meta = await img.metadata().catch(() => null);
    if (!meta || !['jpeg', 'png', 'webp', 'svg', 'heif', 'avif', 'gif'].includes(meta.format || '')) throw new ErrorHttp(400, 'El archivo no es una imagen JPG, PNG o WebP.');
    const id = randomUUID();
    let url: string;
    if (tipo === 'foto') {
      const base = img.rotate();
      const [grande, chica] = await Promise.all([
        base.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer(),
        base.clone().resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toBuffer(),
      ]);
      [url] = await Promise.all([guardarArchivo(`fotos/${id}.jpg`, grande, 'image/jpeg'), guardarArchivo(`fotos/${id}-800.jpg`, chica, 'image/jpeg')]);
    } else {
      const png = await img.rotate().resize(tipo === 'logo' ? { width: 720, height: 240, fit: 'inside', withoutEnlargement: true } : { width: 320, height: 320, fit: 'inside' }).png({ compressionLevel: 9 }).toBuffer();
      url = await guardarArchivo(`${tipo}/${id}.png`, png, 'image/png');
    }
    return NextResponse.json({ url });
  } catch (e) { return respuestaError(e); }
}
