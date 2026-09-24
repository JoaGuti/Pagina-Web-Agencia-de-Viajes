import { leerConfig } from '@/lib/datos';
import { metricas } from '@/lib/google';
import { ruta } from '@/lib/panel/api';

export const dynamic = 'force-dynamic';

export const GET = ruta('metricas', async ({ req }) => {
  const d = Number(req.nextUrl.searchParams.get('dias'));
  const dias = [7, 28, 90].includes(d) ? d : 28;
  const cfg = await leerConfig();
  return metricas(cfg.google, dias);
});
