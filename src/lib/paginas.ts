import { urlBase } from './base';
import { agenciaSchema, grafo, migasSchema } from './seo';
import { cargarSitio } from './sitio/cargar';
import { documento, respuestaHtml } from '@/plantillas/base';
import { paginaError } from '@/plantillas/error';
import { LEGALES } from '@/plantillas/legales';

export async function paginaLegal(req: Request, clave: keyof typeof LEGALES) {
  try {
    const d = await cargarSitio();
    const base = urlBase(req);
    const l = LEGALES[clave];
    return respuestaHtml(documento({
      sitio: d.sitio, viajes: d.viajes, base, ruta: '/' + clave,
      titulo: `${l.titulo} · ${d.sitio.agencia.nombre}`,
      descripcion: l.descripcion,
      jsonld: [grafo(agenciaSchema(d.sitio, base), migasSchema([['Inicio', '/'], [l.titulo, '/' + clave]], base))],
      cuerpo: l.cuerpo(d.sitio),
    }));
  } catch (e) { return paginaError(e); }
}
