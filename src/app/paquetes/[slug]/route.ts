import { datosSitio, paquetePorSlug, urlBase } from '@/lib/datos';
import { agenciaSchema, grafo, migasSchema, paqueteSchema } from '@/lib/seo';
import { dinero } from '@/lib/formato';
import { documento, respuestaHtml } from '@/plantillas/base';
import { pagina404, paginaError } from '@/plantillas/error';
import { cuerpoPaquete } from '@/plantillas/paquete';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const [d, p] = await Promise.all([datosSitio(), /^[a-z0-9-]{1,90}$/.test(slug) ? paquetePorSlug(slug) : null]);
    const base = urlBase(req);
    if (!p) return pagina404(d, base, '/paquetes/' + slug);
    const o = d.ofertas.find(x => x.paqueteId === p.id);
    const a = d.cfg.agencia;
    const desc = p.seoDescripcion || `${p.nombre}: ${p.noches} noches${p.regimen ? ', ' + p.regimen.toLowerCase() : ''}, salida desde ${p.salidaDesde}${p.precio ? `, desde ${dinero(p.precio, p.moneda)} por persona` : ''}. ${p.resumen}`.slice(0, 300);
    return respuestaHtml(documento({
      cfg: d.cfg, paquetes: d.paquetes, base, ruta: '/paquetes/' + p.slug, tipoOg: 'product',
      titulo: p.seoTitulo || `${p.nombre} · Paquete desde ${p.salidaDesde} · ${a.nombre}`,
      descripcion: desc,
      imagen: p.fotos[0],
      jsonld: [grafo(agenciaSchema(d.cfg, base), paqueteSchema(p, d.cfg, base, o), migasSchema([['Inicio', '/'], ['Paquetes', '/#paquetes'], [p.nombre, '/paquetes/' + p.slug]], base))],
      cuerpo: cuerpoPaquete(p, d),
    }));
  } catch (e) { return paginaError(e); }
}
