import type { ConfigDatos, Paquete, Resena } from '@/lib/db/schema';
import type { OfertaVigente } from '@/lib/datos';
import { COLORES_ETIQUETA, dinero, fechaCorta, fechaLarga, iata, numero, ORIGEN_IATA, precioConOferta, proximasSalidas, srcset, whatsapp } from '@/lib/formato';
import { html, raw } from '@/lib/html';
import { ICONO } from './partes';

/** Foto principal con versión liviana para celulares; si no hay foto, un dibujo de respaldo. */
export function foto(p: Paquete, sizes: string, opciones: { i?: number; prioridad?: boolean } = {}) {
  const f = p.fotos[opciones.i ?? 0];
  if (!f) return html`<span class="foto-vacia" aria-hidden="true"><svg viewBox="0 0 64 64"><use href="#d-palm"/></svg></span>`;
  const set = srcset(f);
  return html`<img src="${f}"${set ? html` srcset="${set}" sizes="${sizes}"` : ''} alt="${p.destino}${p.pais ? ', ' + p.pais : ''}" ${raw(opciones.prioridad ? 'fetchpriority="high"' : 'loading="lazy"')} decoding="async">`;
}

function matasellos(id: string, fecha: string, cfg: ConfigDatos) {
  const a = cfg.agencia;
  const texto = `${a.ciudad} · ${a.provincia} · Argentina ·`.toUpperCase();
  const [dia, anio] = fecha ? [fecha.split(' ').slice(0, 2).join(' '), fecha.split(' ')[2] ? '20' + fecha.split(' ')[2] : String(new Date().getFullYear())] : ['', ''];
  return html`<span class="postmark" aria-hidden="true"><svg viewBox="0 0 170 100"><circle cx="50" cy="50" r="44"/><circle cx="50" cy="50" r="30"/><path id="pm-${id}" d="M50 50 m-37 0 a37 37 0 1 1 74 0 a37 37 0 1 1 -74 0" stroke="none"/><text><textPath href="#pm-${id}">${texto}</textPath></text><text x="50" y="47" text-anchor="middle" style="font-size:11px">${dia.toUpperCase()}</text><text x="50" y="60" text-anchor="middle">${anio}</text><path d="M100 34q8-6 16 0t16 0 16 0 16 0M100 50q8-6 16 0t16 0 16 0 16 0M100 66q8-6 16 0t16 0 16 0 16 0"/></svg></span>`;
}

export function postal(p: Paquete, cfg: ConfigDatos) {
  const salidas = proximasSalidas(p);
  return html`
<article class="dcard" data-tilt>
  <div class="dcard-photo">${foto(p, '(max-width: 899px) 78vw, 330px')}<span class="stamp">${ICONO.avion}<b>${iata(p)}</b></span></div>${matasellos(p.id.slice(0, 8), salidas[0] ? fechaCorta(salidas[0]) : '', cfg)}
  <div class="dcard-body">
    <span class="dcard-country">${p.pais}${p.coord ? ' · ' + p.coord : ''}</span>
    <h3>${p.destino || p.nombre}</h3>
    <p>${p.resumen}</p>
    <div class="dcard-foot"><span class="dcard-price">${p.precio ? html`desde <b>${dinero(p.precio, p.moneda)}</b>` : 'Consultá precio'}</span><a class="dcard-go" href="/paquetes/${p.slug}" aria-label="Ver el paquete a ${p.destino}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></div>
  </div>
</article>`;
}

export function etiqueta(p: Paquete) {
  if (!p.etiqueta) return '';
  const col = COLORES_ETIQUETA[p.etiquetaColor] || null;
  return html`<span class="tag"${col ? raw(` style="background:${col[0]};color:${col[1]}"`) : ''}>${p.etiqueta}</span>`;
}

export function tarjetaPaquete(p: Paquete, cfg: ConfigDatos, oferta?: OfertaVigente) {
  const salidas = proximasSalidas(p);
  const meses = [...new Set(salidas.map(s => s.slice(0, 7)))].join(' ');
  const precio = oferta ? precioConOferta(p.precio, oferta) : p.precio;
  const msg = `Hola! Quiero info del paquete "${p.nombre}" (${p.noches} noches).`;
  return html`
<article class="pcard" data-region="${p.region}" data-meses="${meses}">
  <a class="pcard-art" href="/paquetes/${p.slug}" tabindex="-1" aria-hidden="true">${foto(p, '(max-width: 640px) 92vw, 400px')}${etiqueta(p)}</a>
  <div class="pcard-body">
    <div class="pcard-meta"><span>${p.noches} noches</span>${p.regimen ? html`<span>${p.regimen}</span>` : ''}<span>${p.transporte || 'Aéreo'} desde ${p.salidaDesde || 'Córdoba'}</span></div>
    <h3><a href="/paquetes/${p.slug}">${p.nombre}</a></h3>
    <p>${p.resumen}</p>
    ${salidas.length ? html`<div class="dates" aria-label="Fechas de salida">${salidas.slice(0, 4).map(d => html`<span>${fechaCorta(d)}</span>`)}${salidas.length > 4 ? html`<span>+${salidas.length - 4}</span>` : ''}</div>` : ''}
    ${p.cupos > 0 && p.cupos <= 5 ? html`<span class="seats">Quedan ${p.cupos} lugares</span>` : ''}
    <div class="pcard-foot">
      <div class="price">${precio ? html`<small>por persona desde</small>${oferta ? html`<s class="antes">${dinero(p.precio, p.moneda)}</s>` : ''}<b>${dinero(precio, p.moneda)}</b>${p.moneda === 'USD' && cfg.cotizacion > 0 ? html`<div class="ars">≈ ARS ${numero(precio * cfg.cotizacion)}</div>` : ''}${p.cuotas ? html`<div class="ars">o ${p.cuotas} cuotas sin interés</div>` : ''}` : html`<small>Precio</small><b class="consultar">a consultar</b>`}</div>
      <div class="pcard-btns"><a class="btn outline" href="/paquetes/${p.slug}">Ver detalle</a><a class="btn dark" href="${whatsapp(cfg, msg)}" target="_blank" rel="noopener">Consultar</a></div>
    </div>
  </div>
</article>`;
}

export function tarjetaOferta(o: OfertaVigente, cfg: ConfigDatos) {
  const p = o.paquete;
  const nuevo = precioConOferta(p.precio, o);
  const pct = p.precio > 0 ? Math.round((1 - nuevo / p.precio) * 100) : o.descuento;
  const cupos = o.cupos || p.cupos;
  const salidas = proximasSalidas(p);
  return html`
<article class="pass" aria-label="Tarjeta de embarque: ${o.titulo}" data-vence="${o.hasta.toISOString()}">
  <a class="pass-photo" href="/paquetes/${p.slug}" tabindex="-1" aria-hidden="true">${foto(p, '(max-width: 1000px) 92vw, 420px')}${pct > 0 ? html`<span class="offer-badge">−${pct}%</span>` : ''}</a>
  <div class="pass-main">
    <div class="pass-head"><span>Tarjeta de embarque</span><span>Clase: ${o.etiqueta || 'Oferta'}</span></div>
    <div class="pass-route"><div><b>${ORIGEN_IATA[p.salidaDesde] || p.salidaDesde.slice(0, 3).toUpperCase() || 'COR'}</b><small>${p.salidaDesde || 'Córdoba'}</small></div><span class="pass-line" aria-hidden="true">${ICONO.avion}</span><div><b>${iata(p)}</b><small>${p.destino}</small></div></div>
    <h3><a href="/paquetes/${p.slug}">${o.titulo}</a></h3>
    <p>${o.nota || p.resumen}</p>
    <dl class="pass-fields">
      <div><dt>Salida</dt><dd>${salidas.length ? fechaCorta(salidas[0]) : 'A confirmar'}</dd></div>
      <div><dt>Noches</dt><dd>${p.noches}</dd></div>
      <div><dt>Régimen</dt><dd>${p.regimen || '—'}</dd></div>
      <div><dt>Lugares</dt><dd>${cupos || 'Consultar'}</dd></div>
    </dl>
  </div>
  <div class="pass-stub">
    ${cupos ? html`<span class="chip"><span class="dot"></span>Quedan ${cupos} lugares</span>` : ''}
    <div class="offer-price">${nuevo !== p.precio ? html`<s>${dinero(p.precio, p.moneda)}</s>` : ''}<b>${dinero(nuevo, p.moneda)}</b><small>por persona en base doble</small></div>
    ${o.contador ? raw('<div class="count" aria-label="Tiempo restante de la oferta"><div><b>00</b><span>días</span></div><div><b>00</b><span>horas</span></div><div><b>00</b><span>min</span></div><div><b>00</b><span>seg</span></div></div>') : html`<p class="valida">Válida hasta el ${fechaLarga(o.hasta)}</p>`}
    <a class="btn" href="${whatsapp(cfg, 'Hola! Quiero la oferta ' + o.titulo)}" target="_blank" rel="noopener" style="justify-content:center">Quiero esta oferta</a>
    <div class="barcode" aria-hidden="true"></div>
  </div>
</article>`;
}

const COLORES_AVATAR = ['#5c6bc0', '#26a69a', '#ef6c00', '#8d6e63', '#ec407a', '#7e57c2', '#43a047', '#0288d1'];
export function tarjetaResena(r: Resena) {
  let h = 0; for (const c of r.autor) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const col = COLORES_AVATAR[h % COLORES_AVATAR.length];
  const e = Math.max(1, Math.min(5, r.estrellas));
  return html`<article class="rv"><header><span class="av" style="background:${col}" aria-hidden="true">${[...r.autor][0] || '?'}</span><div class="who"><b>${r.autor}</b><small>Reseña en Google</small></div>${ICONO.google}</header><div class="rv-meta"><span class="rv-stars" aria-label="${e} de 5 estrellas">${'★'.repeat(e)}${'☆'.repeat(5 - e)}</span><span>${r.cuando}</span></div><p>${r.texto}</p></article>`;
}
