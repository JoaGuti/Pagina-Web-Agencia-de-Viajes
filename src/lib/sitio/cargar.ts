import { KuroApiError, kuro } from '@/lib/kuro';
import { aOfertas, aSitio, aViaje, ordenarViajes } from './adaptador';
import type { DatosSitio, Viaje } from './modelo';

/**
 * Lee de Kuro todo lo publicado que necesita una página. Una sola fuente de verdad: si Kuro falla, el
 * error sube (la ruta muestra una página de error controlada); jamás se cambia a otra fuente.
 */
export async function cargarSitio(ahora = new Date()): Promise<DatosSitio> {
  const k = kuro();
  const [site, paquetes, ofertas] = await Promise.all([k.site.get(), k.travel.packages.listAll(), k.travel.offers.listAll()]);
  const sitio = aSitio(site, ahora);
  const viajes = ordenarViajes(paquetes.map(p => aViaje(p, sitio)), paquetes);
  return { sitio, viajes, ofertas: aOfertas(ofertas, viajes, sitio) };
}

export type ResultadoViaje = { tipo: 'ok'; viaje: Viaje } | { tipo: 'redirigir'; segmento: string } | { tipo: 'noEncontrado' };

/**
 * Resuelve el segmento de URL a un viaje publicado. La identidad es el publicId (el slug no lo es):
 * si el slug cambió, se redirige a la URL vigente; si el paquete se retiró, no hay ficha.
 */
export async function resolverViaje(datos: DatosSitio, segmento: string): Promise<ResultadoViaje> {
  const candidato = datos.viajes.find(v => v.segmento === segmento) ?? datos.viajes.find(v => segmento === v.id || segmento.endsWith(`-${v.id}`));
  if (!candidato) return { tipo: 'noEncontrado' };
  try {
    const detalle = await kuro().travel.packages.get(candidato.id);
    const viaje = aViaje(detalle, datos.sitio);
    if (viaje.segmento !== segmento) return { tipo: 'redirigir', segmento: viaje.segmento };
    return { tipo: 'ok', viaje };
  } catch (e) {
    if (e instanceof KuroApiError && e.noEncontrado) return { tipo: 'noEncontrado' };
    throw e;
  }
}
