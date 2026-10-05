import { TEXTOS } from '@/contenido/sitio';
import { UBICACION } from '@/contenido/agencia';
import { urlBase } from '@/lib/base';
import { dinero, duracion, fechaLarga, proximasSalidas, urlViaje } from '@/lib/formato';
import { cargarSitio } from '@/lib/sitio/cargar';

export const dynamic = 'force-dynamic';

/** Resumen en texto plano para buscadores con IA (GEO), solo con lo publicado en Kuro. */
export async function GET(req: Request) {
  const base = urlBase(req);
  let d;
  try { d = await cargarSitio(); } catch {
    return new Response('Servicio no disponible', { status: 503, headers: { 'Retry-After': '30', 'Cache-Control': 'no-store' } });
  }
  const a = d.sitio.agencia;
  const lineas = [
    a.direccion && `- Dirección: ${[a.direccion, UBICACION.ciudad, UBICACION.provincia].join(', ')}, Argentina`,
    a.telefono && `- Teléfono: ${a.telefono}`,
    a.whatsapp && `- WhatsApp: https://wa.me/${a.whatsapp}`,
    a.email && `- Email: ${a.email}`,
    `- Horario: ${UBICACION.horario}`,
    a.habilitacion && `- ${a.habilitacionEtiqueta || 'Habilitación'} ${a.habilitacion}${a.cuit ? ` · CUIT ${a.cuit}` : ''}${a.razonSocial ? ` · ${a.razonSocial}` : ''}`,
  ].filter(Boolean);
  const txt = `# ${a.nombre}

> ${d.sitio.seo.descripcion || TEXTOS.descripcionSeo}

${lineas.join('\n')}

## Paquetes publicados

${d.viajes.length ? d.viajes.map(v => `- [${v.nombre}](${base}${urlViaje(v)}): ${[duracion(v), v.regimen, v.origen && `salida desde ${v.origen}`, v.precioDesde && `desde ${dinero(v.precioDesde)}`].filter(Boolean).join(', ')}. ${v.resumen ? v.resumen.replace(/\.?$/, '.') : ''}${proximasSalidas(v).length ? ` Salidas: ${proximasSalidas(v).slice(0, 4).join(', ')}.` : ''}`).join('\n') : '- No hay paquetes publicados en este momento.'}

## Ofertas vigentes

${d.ofertas.length ? d.ofertas.map(o => `- ${o.titulo}${o.precio ? `: ${dinero(o.precio)}` : ''}${o.vence ? `, válida hasta el ${fechaLarga(o.vence, d.sitio.zonaHoraria)}` : ''}.`).join('\n') : '- No hay ofertas vigentes en este momento.'}
${d.sitio.faqs.length ? `\n## Preguntas frecuentes\n\n${d.sitio.faqs.map(q => `### ${q.pregunta}\n${q.respuesta}`).join('\n\n')}\n` : ''}
## Páginas

- [Inicio](${base}/)
- [Política de privacidad](${base}/privacidad)
- [Términos y condiciones](${base}/terminos)
- [Botón de arrepentimiento](${base}/arrepentimiento)
`;
  return new Response(txt, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}
