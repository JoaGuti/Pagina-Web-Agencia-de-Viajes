import { urlBase } from '@/lib/base';
import { dinero, duracion, urlViaje } from '@/lib/formato';
import { agenciaSchema, grafo, migasSchema, paqueteSchema } from '@/lib/seo';
import { cargarSitio, resolverViaje } from '@/lib/sitio/cargar';
import { documento, respuestaHtml } from '@/plantillas/base';
import { pagina404, paginaError } from '@/plantillas/error';
import { cuerpoPaquete } from '@/plantillas/paquete';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const d = await cargarSitio();
    const base = urlBase(req);
    // Un paquete retirado (o inexistente) no tiene ficha: 404.
    const r = slug.length <= 200 ? await resolverViaje(d, slug) : ({ tipo: 'noEncontrado' } as const);
    if (r.tipo === 'noEncontrado') return pagina404(d, base, '/paquetes/' + slug);
    // El slug no es identidad: si cambió, se redirige a la URL vigente del mismo publicId.
    if (r.tipo === 'redirigir') return Response.redirect(`${base}/paquetes/${encodeURIComponent(r.segmento)}`, 308);
    const v = r.viaje;
    const o = d.ofertas.find(x => x.viaje?.id === v.id);
    const nombre = d.sitio.agencia.nombre;
    const dur = duracion(v);
    const auto = [`${v.nombre}${dur ? ': ' + dur : ''}`, v.origen ? `salida desde ${v.origen}` : '', v.precioDesde ? `desde ${dinero(v.precioDesde)}` : '', v.resumen].filter(Boolean).join(', ');
    const c = v.contenido;
    return respuestaHtml(documento({
      sitio: d.sitio, viajes: d.viajes, base, ruta: urlViaje(v), tipoOg: 'product',
      titulo: c?.seo.titulo || `${v.nombre} · ${nombre}`,
      descripcion: (c?.seo.descripcion || auto).slice(0, 300),
      imagen: v.fotos[0]?.url,
      jsonld: [grafo(agenciaSchema(d.sitio, base), paqueteSchema(v, base, o), migasSchema([['Inicio', '/'], ['Paquetes', '/#paquetes'], [v.nombre, urlViaje(v)]], base))],
      cuerpo: cuerpoPaquete(v, d),
    }));
  } catch (e) { return paginaError(e); }
}
