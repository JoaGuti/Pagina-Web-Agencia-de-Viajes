import { datosSitio, urlBase } from './datos';
import { agenciaSchema, grafo, migasSchema } from './seo';
import { documento, respuestaHtml } from '@/plantillas/base';
import { paginaError } from '@/plantillas/error';
import { LEGALES } from '@/plantillas/legales';

export async function paginaLegal(req: Request, clave: keyof typeof LEGALES) {
  try {
    const d = await datosSitio();
    const base = urlBase(req);
    const l = LEGALES[clave];
    return respuestaHtml(documento({
      cfg: d.cfg, paquetes: d.paquetes, base, ruta: '/' + clave,
      titulo: `${l.titulo} · ${d.cfg.agencia.nombre}`,
      descripcion: l.descripcion,
      jsonld: [grafo(agenciaSchema(d.cfg, base), migasSchema([['Inicio', '/'], [l.titulo, '/' + clave]], base))],
      cuerpo: l.cuerpo(d.cfg),
    }));
  } catch (e) { return paginaError(e); }
}
