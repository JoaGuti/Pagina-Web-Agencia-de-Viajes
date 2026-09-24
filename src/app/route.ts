import { TEXTOS } from '@/contenido/sitio';
import { datosSitio, urlBase } from '@/lib/datos';
import { raw } from '@/lib/html';
import { agenciaSchema, grafo, listaPaquetesSchema, preguntasSchema, sitioSchema } from '@/lib/seo';
import { documento, respuestaHtml } from '@/plantillas/base';
import { cuerpoInicio } from '@/plantillas/inicio';
import { paginaError } from '@/plantillas/error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const d = await datosSitio();
    const base = urlBase(req);
    const a = d.cfg.agencia;
    return respuestaHtml(documento({
      cfg: d.cfg, paquetes: d.paquetes, base, ruta: '/', enInicio: true,
      titulo: `${a.nombre} · ${TEXTOS.tituloSeo}`,
      descripcion: TEXTOS.descripcionSeo,
      jsonld: [grafo(agenciaSchema(d.cfg, base), sitioSchema(d.cfg, base), preguntasSchema(d.cfg), listaPaquetesSchema(d.paquetes, base))],
      precargar: raw('<link rel="preload" as="image" href="/media/hero-playa.jpg" fetchpriority="high">'),
      cuerpo: cuerpoInicio(d),
    }));
  } catch (e) {
    return paginaError(e);
  }
}
