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

> ${d.cfg.textos.descripcionSeo}

- Dirección: ${dir}${a.cp ? ` (${a.cp})` : ''}, Argentina
- Teléfono: ${a.telefono}
- WhatsApp: https://wa.me/${a.whatsapp.replace(/\D/g, '')}
- Email: ${a.email}
- Horario: ${a.horario}
${[a.legajo && `Legajo EVyT N° ${a.legajo}`, a.cuit && `CUIT ${a.cuit}`, a.razonSocial].filter(Boolean).map(x => `- ${x}`).join('\n')}
${d.cfg.resenas.puntaje ? `- Puntaje en Google: ${d.cfg.resenas.puntaje} de 5 (${d.cfg.resenas.cantidad} reseñas)\n` : ''}
## Paquetes publicados

${d.paquetes.map(p => `- [${p.nombre}](${base}/paquetes/${p.slug}): ${p.noches} noches${p.regimen ? `, ${p.regimen}` : ''}, salida desde ${p.salidaDesde}${p.precio ? `, desde ${dinero(p.precio, p.moneda)} por persona` : ''}. ${p.resumen}${proximasSalidas(p).length ? ` Salidas: ${proximasSalidas(p).slice(0, 4).join(', ')}.` : ''}`).join('\n')}

## Ofertas vigentes

${d.ofertas.length ? d.ofertas.map(o => `- ${o.titulo} (${o.paquete.nombre}): ${dinero(precioConOferta(o.paquete.precio, o), o.paquete.moneda)} por persona, válida hasta el ${fechaLarga(o.hasta)}.`).join('\n') : '- No hay ofertas vigentes en este momento.'}

## Preguntas frecuentes

${d.cfg.textos.preguntas.map(q => `### ${q.p}\n${q.r}`).join('\n\n')}

## Páginas

- [Inicio](${base}/)
- [Política de privacidad](${base}/privacidad)
- [Términos y condiciones](${base}/terminos)
- [Botón de arrepentimiento](${base}/arrepentimiento)
`;
  return new Response(txt, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=600' } });
}
