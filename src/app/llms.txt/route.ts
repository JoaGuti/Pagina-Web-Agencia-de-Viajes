import { PREGUNTAS, respuesta, TEXTOS } from '@/contenido/sitio';
import { datosSitio, urlBase } from '@/lib/datos';
import { dinero, direccionCompleta, fechaLarga, precioConOferta, proximasSalidas } from '@/lib/formato';

export const dynamic = 'force-dynamic';

/** Resumen en texto plano para buscadores con IA (GEO). */
export async function GET(req: Request) {
  const d = await datosSitio();
  const base = urlBase(req);
  const a = d.cfg.agencia;
  const dir = direccionCompleta(d.cfg);
  const txt = `# ${a.nombre}

> ${TEXTOS.descripcionSeo}

- Dirección: ${dir}${a.cp ? ` (${a.cp})` : ''}, Argentina
- Teléfono: ${a.telefono}
- WhatsApp: https://wa.me/${a.whatsapp.replace(/\D/g, '')}
- Email: ${a.email}
- Horario: ${a.horario}
- Legajo EVyT N° ${a.legajo} · CUIT ${a.cuit} · ${a.razonSocial}
- Puntaje en Google: ${d.cfg.resenas.puntaje} de 5 (${d.cfg.resenas.cantidad} reseñas)

## Paquetes publicados

${d.paquetes.map(p => `- [${p.nombre}](${base}/paquetes/${p.slug}): ${p.noches} noches${p.regimen ? `, ${p.regimen}` : ''}, salida desde ${p.salidaDesde}${p.precio ? `, desde ${dinero(p.precio, p.moneda)} por persona` : ''}. ${p.resumen}${proximasSalidas(p).length ? ` Salidas: ${proximasSalidas(p).slice(0, 4).join(', ')}.` : ''}`).join('\n')}

## Ofertas vigentes

${d.ofertas.length ? d.ofertas.map(o => `- ${o.titulo} (${o.paquete.nombre}): ${dinero(precioConOferta(o.paquete.precio, o), o.paquete.moneda)} por persona, válida hasta el ${fechaLarga(o.hasta)}.`).join('\n') : '- No hay ofertas vigentes en este momento.'}

## Preguntas frecuentes

${PREGUNTAS.map(q => `### ${q.p}\n${respuesta(q, dir, a.horario)}`).join('\n\n')}

## Páginas

- [Inicio](${base}/)
- [Política de privacidad](${base}/privacidad)
- [Términos y condiciones](${base}/terminos)
- [Botón de arrepentimiento](${base}/arrepentimiento)
`;
  return new Response(txt, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=600' } });
}
