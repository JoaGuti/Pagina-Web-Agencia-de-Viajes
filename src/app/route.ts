import { TEXTOS } from '@/contenido/sitio';
import { urlBase } from '@/lib/base';
import { raw } from '@/lib/html';
import { agenciaSchema, grafo, listaPaquetesSchema, preguntasSchema, sitioSchema } from '@/lib/seo';
import { cargarSitio } from '@/lib/sitio/cargar';
import { documento, respuestaHtml } from '@/plantillas/base';
import { paginaError } from '@/plantillas/error';
import { cuerpoInicio } from '@/plantillas/inicio';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const d = await cargarSitio();
    const base = urlBase(req);
    const nombre = d.sitio.agencia.nombre;
    return respuestaHtml(documento({
      sitio: d.sitio, viajes: d.viajes, base, ruta: '/', enInicio: true,
      // Título y descripción de la agencia: los de Kuro (Mi web → SEO) y, si faltan, los de presentación.
      titulo: d.sitio.seo.titulo || `${nombre} · ${TEXTOS.tituloSeo}`,
      descripcion: d.sitio.seo.descripcion || TEXTOS.descripcionSeo,
      jsonld: [grafo(agenciaSchema(d.sitio, base), sitioSchema(d.sitio, base), preguntasSchema(d.sitio), listaPaquetesSchema(d.viajes, base))],
      precargar: raw('<link rel="preload" as="image" href="/media/hero-playa.jpg" fetchpriority="high">'),
      cuerpo: cuerpoInicio(d),
    }));
  } catch (e) {
    return paginaError(e);
  }
}
