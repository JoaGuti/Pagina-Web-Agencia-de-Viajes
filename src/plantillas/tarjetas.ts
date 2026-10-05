import { UBICACION } from '@/contenido/agencia';
import type { Resena } from '@/contenido/resenas';
import { abreviatura, dinero, duracion, fechaCorta, fechaLarga, proximasSalidas, urlViaje, whatsapp } from '@/lib/formato';
import { ETIQUETA_UNIDAD } from '@/lib/kuro';
import { html, raw } from '@/lib/html';
import type { OfertaVista, Sitio, Viaje } from '@/lib/sitio/modelo';
import { ICONO } from './partes';

/** Foto del viaje tal cual la entrega la Content API (`photos[].url`); sin foto, un dibujo de respaldo. */
export function foto(v: Viaje, sizes: string, opciones: { i?: number; prioridad?: boolean } = {}) {
  const f = v.fotos[opciones.i ?? 0];
  if (!f) return html`<span class="foto-vacia" aria-hidden="true"><svg viewBox="0 0 64 64"><use href="#d-palm"/></svg></span>`;
  return html`<img src="${f.url}" sizes="${sizes}" alt="${f.alt || v.destino}" ${raw(opciones.prioridad ? 'fetchpriority="high"' : 'loading="lazy"')} decoding="async">`;
}

function matasellos(id: string, fecha: string) {
  const texto = `${UBICACION.ciudad} · ${UBICACION.provincia} · Argentina ·`.toUpperCase();
  const [dia, anio] = fecha ? [fecha.split(' ').slice(0, 2).join(' '), fecha.split(' ')[2] ? '20' + fecha.split(' ')[2] : String(new Date().getFullYear())] : ['', ''];
  const idSeguro = id.replace(/[^A-Za-z0-9_-]/g, '');
  return html`<span class="postmark" aria-hidden="true"><svg viewBox="0 0 170 100"><circle cx="50" cy="50" r="44"/><circle cx="50" cy="50" r="30"/><path id="pm-${idSeguro}" d="M50 50 m-37 0 a37 37 0 1 1 74 0 a37 37 0 1 1 -74 0" stroke="none"/><text><textPath href="#pm-${idSeguro}">${texto}</textPath></text><text x="50" y="47" text-anchor="middle" style="font-size:11px">${dia.toUpperCase()}</text><text x="50" y="60" text-anchor="middle">${anio}</text><path d="M100 34q8-6 16 0t16 0 16 0 16 0M100 50q8-6 16 0t16 0 16 0 16 0M100 66q8-6 16 0t16 0 16 0 16 0"/></svg></span>`;
}

export function postal(v: Viaje) {
  const salidas = proximasSalidas(v);
  return html`
<article class="dcard" data-tilt>
  <div class="dcard-photo">${foto(v, '(max-width: 899px) 78vw, 330px')}<span class="stamp">${ICONO.avion}<b>${abreviatura(v.destino)}</b></span></div>${matasellos(v.id, salidas[0] ? fechaCorta(salidas[0]) : '')}
  <div class="dcard-body">
    <span class="dcard-country">${v.destinos.slice(1).join(' · ') || v.modalidad}</span>
    <h3>${v.destino}</h3>
    <p>${v.resumen}</p>
    <div class="dcard-foot"><span class="dcard-price">${v.precioDesde ? html`desde <b>${dinero(v.precioDesde)}</b>` : 'Consultar'}</span><a class="dcard-go" href="${urlViaje(v)}" aria-label="Ver el paquete ${v.nombre}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></div>
  </div>
</article>`;
}

export function etiqueta(v: Viaje) {
  return v.etiqueta ? html`<span class="tag">${v.etiqueta}</span>` : '';
}

/** Precio «desde» de un viaje, o «a consultar» cuando Kuro no tiene una tarifa vigente de una salida consultable. */
export function bloquePrecio(v: Viaje) {
  const p = v.precioDesde;
  if (!p) return html`<small>Precio</small><b class="consultar">Consultar</b>`;
  return html`<small>desde</small><b>${dinero(p)}</b><div class="ars">${ETIQUETA_UNIDAD[p.unit]}</div>${v.cuotas ? html`<div class="ars">en ${v.cuotas} cuotas</div>` : ''}`;
}

export function tarjetaPaquete(v: Viaje, sitio: Sitio, oferta?: OfertaVista) {
  const salidas = proximasSalidas(v);
  const meses = [...new Set(salidas.map(s => s.slice(0, 7)))].join(' ');
  const wa = whatsapp(sitio, v.contenido?.ctaWhatsapp || `Hola! Quiero info del paquete "${v.nombre}".`);
  const url = urlViaje(v);
  const dur = duracion(v);
  return html`
<article class="pcard" data-region="${v.region}" data-meses="${meses}">
  <a class="pcard-art" href="${url}" tabindex="-1" aria-hidden="true">${foto(v, '(max-width: 640px) 92vw, 400px')}${etiqueta(v)}</a>
  <div class="pcard-body">
    <div class="pcard-meta">${dur ? html`<span>${dur}</span>` : ''}${v.regimen ? html`<span>${v.regimen}</span>` : ''}<span>${v.modalidad}${v.origen ? ' desde ' + v.origen : ''}</span></div>
    <h3><a href="${url}">${v.nombre}</a></h3>
    <p>${v.resumen}</p>
    ${salidas.length ? html`<div class="dates" aria-label="Fechas de salida">${salidas.slice(0, 4).map(d => html`<span>${fechaCorta(d)}</span>`)}${salidas.length > 4 ? html`<span>+${salidas.length - 4}</span>` : ''}</div>` : ''}
    ${oferta ? html`<span class="seats">En oferta: ${oferta.etiqueta}</span>` : ''}
    <div class="pcard-foot">
      <div class="price">${bloquePrecio(v)}</div>
      <div class="pcard-btns"><a class="btn outline" href="${url}">Ver detalle</a><a class="btn dark" href="${wa || url + '#contacto'}"${wa ? raw(' target="_blank" rel="noopener"') : ''}>Consultar</a></div>
    </div>
  </div>
</article>`;
}

export function tarjetaOferta(o: OfertaVista, sitio: Sitio) {
  const v = o.viaje;
  const ficha = v ? urlViaje(v) : '';
  const destino = o.destino || v?.destino || o.titulo;
  const origen = v?.origen ?? null;
  const salidas = v ? proximasSalidas(v) : [];
  const foto_ = o.foto ? html`<img src="${o.foto}" alt="${o.titulo}" loading="lazy" decoding="async">` : html`<span class="foto-vacia" aria-hidden="true"><svg viewBox="0 0 64 64"><use href="#d-palm"/></svg></span>`;
  const badge = o.descuentoPct && o.descuentoPct > 0 ? html`<span class="offer-badge">−${o.descuentoPct}%</span>` : '';
  const wa = whatsapp(sitio, `Hola! Quiero la oferta ${o.titulo}`);
  return html`
<article class="pass" aria-label="Tarjeta de embarque: ${o.titulo}"${o.vence && o.contador ? html` data-vence="${o.vence.toISOString()}"` : ''}>
  ${ficha ? html`<a class="pass-photo" href="${ficha}" tabindex="-1" aria-hidden="true">${foto_}${badge}</a>` : html`<div class="pass-photo" aria-hidden="true">${foto_}${badge}</div>`}
  <div class="pass-main">
    <div class="pass-head"><span>Tarjeta de embarque</span><span>Clase: ${o.etiqueta}</span></div>
    <div class="pass-route">${origen ? html`<div><b>${abreviatura(origen)}</b><small>${origen}</small></div><span class="pass-line" aria-hidden="true">${ICONO.avion}</span>` : ''}<div><b>${abreviatura(destino)}</b><small>${destino}</small></div></div>
    <h3>${ficha ? html`<a href="${ficha}">${o.titulo}</a>` : o.titulo}</h3>
    <p>${o.resumen || v?.resumen || ''}</p>
    <dl class="pass-fields">
      <div><dt>Salida</dt><dd>${salidas.length ? fechaCorta(salidas[0]) : o.fechasViaje || 'A confirmar'}</dd></div>
      ${v && duracion(v) ? html`<div><dt>Duración</dt><dd>${duracion(v)}</dd></div>` : html`<div><dt>Tipo</dt><dd>${o.tipo}</dd></div>`}
      <div><dt>Régimen</dt><dd>${v?.regimen || '—'}</dd></div>
      <div><dt>Lugares</dt><dd>${o.cupos ?? 'Consultar'}</dd></div>
    </dl>
  </div>
  <div class="pass-stub">
    ${o.cupos ? html`<span class="chip"><span class="dot"></span>Quedan ${o.cupos} lugares</span>` : ''}
    <div class="offer-price">${o.precio ? html`${o.precioAnterior ? html`<s>${dinero(o.precioAnterior)}</s>` : ''}<b>${dinero(o.precio)}</b>${o.nota ? html`<small>${o.nota}</small>` : ''}` : html`<b>Consultá el precio</b>${o.nota ? html`<small>${o.nota}</small>` : ''}`}</div>
    ${o.contador && o.vence ? raw('<div class="count" aria-label="Tiempo restante de la oferta"><div><b>00</b><span>días</span></div><div><b>00</b><span>horas</span></div><div><b>00</b><span>min</span></div><div><b>00</b><span>seg</span></div></div>') : o.vence ? html`<p class="valida">Válida hasta el ${fechaLarga(o.vence, sitio.zonaHoraria)}</p>` : ''}
    <a class="btn" href="${wa || (ficha ? ficha + '#contacto' : '#contactForm')}"${wa ? raw(' target="_blank" rel="noopener"') : raw(' data-quote')} style="justify-content:center">Quiero esta oferta</a>
    <div class="barcode" aria-hidden="true"></div>
  </div>
</article>`;
}

const COLORES_AVATAR = ['#5c6bc0', '#26a69a', '#ef6c00', '#8d6e63', '#ec407a', '#7e57c2', '#43a047', '#0288d1'];
export function tarjetaResena(r: Resena, esEjemplo: boolean) {
  let h = 0; for (const c of r.autor) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const col = COLORES_AVATAR[h % COLORES_AVATAR.length];
  const e = Math.max(1, Math.min(5, r.estrellas));
  return html`<article class="rv"><header><span class="av" style="background:${col}" aria-hidden="true">${[...r.autor][0] || '?'}</span><div class="who"><b>${r.autor}</b><small>${esEjemplo ? 'Testimonio de ejemplo' : 'Reseña en Google'}</small></div>${esEjemplo ? '' : ICONO.google}</header><div class="rv-meta"><span class="rv-stars" aria-label="${e} de 5 estrellas">${'★'.repeat(e)}${'☆'.repeat(5 - e)}</span><span>${r.cuando}</span></div><p>${r.texto}</p></article>`;
}
