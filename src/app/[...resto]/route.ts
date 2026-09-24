import { datosSitio, urlBase } from '@/lib/datos';
import { pagina404, paginaError } from '@/plantillas/error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const d = await datosSitio();
    return pagina404(d, urlBase(req), new URL(req.url).pathname);
  } catch (e) { return paginaError(e); }
}
