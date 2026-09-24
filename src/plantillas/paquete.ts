import type { DatosSitio, OfertaVigente } from '@/lib/datos';
import type { Paquete } from '@/lib/db/schema';
import { dinero, fechaCorta, fechaLarga, numero, precioConOferta, proximasSalidas, REGIONES, whatsapp } from '@/lib/formato';
import { html } from '@/lib/html';
import { ICONO, formularioConsulta } from './partes';
import { etiqueta, foto, tarjetaPaquete } from './tarjetas';

const parrafos = (t: string) => t.split(/\n{2,}|\r\n\r\n/).map(s => s.trim()).filter(Boolean).map(s => html`<p>${s}</p>`);

function galeria(p: Paquete) {
  if (p.fotos.length <= 1) return html`<div class="galeria una"><figure class="g-main">${foto(p, '(max-width: 900px) 100vw, 760px', { prioridad: true })}${etiqueta(p)}</figure></div>`;
  return html`<div class="galeria" id="galeria">
    <figure class="g-main">${foto(p, '(max-width: 900px) 100vw, 760px', { prioridad: true })}${etiqueta(p)}</figure>
    <div class="g-thumbs" role="list">${p.fotos.slice(0, 8).map((f, i) => html`<button type="button" role="listitem" class="g-th${i === 0 ? ' on' : ''}" data-foto="${f}" aria-label="Ver foto ${i + 1} de ${p.fotos.length}">${foto(p, '160px', { i })}</button>`)}</div>
  </div>`;
}

function cajaPrecio(p: Paquete, d: DatosSitio, o?: OfertaVigente) {
  const { cfg } = d;
  const precio = o ? precioConOferta(p.precio, o) : p.precio;
  const filas: [string, number][] = ([['Base doble', precio], ['Base single', p.precioSingle], ['Base triple', p.precioTriple], ['Menor', p.precioMenor]] as [string, number][]).filter(([, v]) => v > 0);
  const msg = `Hola! Quiero reservar el paquete "${p.nombre}" (${p.noches} noches).`;
  return html`
<aside class="ficha-precio" aria-label="Precio y reserva">
  ${o ? html`<p class="fp-oferta"><span>${o.etiqueta || 'Oferta'}</span>${o.contador ? html`<span class="fp-vence" data-vence="${o.hasta.toISOString()}">vence el ${fechaLarga(o.hasta)}</span>` : html`<span>hasta el ${fechaLarga(o.hasta)}</span>`}</p>` : ''}
  ${precio > 0 ? html`
  <p class="fp-desde">Por persona desde</p>
  <p class="fp-precio">${o && precio !== p.precio ? html`<s>${dinero(p.precio, p.moneda)}</s>` : ''}<b>${dinero(precio, p.moneda)}</b></p>
  ${p.moneda === 'USD' && cfg.cotizacion > 0 ? html`<p class="fp-ars">≈ ARS ${numero(precio * cfg.cotizacion)} al cambio de hoy</p>` : ''}
  ${filas.length > 1 ? html`<dl class="fp-tabla">${filas.map(([k, v]) => html`<div><dt>${k}</dt><dd>${dinero(v, p.moneda)}</dd></div>`)}</dl>` : ''}
  <ul class="fp-cond">
    ${p.cuotas ? html`<li>${ICONO.check}Hasta ${p.cuotas} cuotas sin interés</li>` : ''}
    ${p.sena ? html`<li>${ICONO.check}Reservás con el ${p.sena}% de seña</li>` : ''}
    ${p.cupos > 0 ? html`<li>${ICONO.check}${p.cupos <= 5 ? `Quedan solo ${p.cupos} lugares` : `${p.cupos} lugares disponibles`}</li>` : ''}
  </ul>` : html`<p class="fp-precio"><b>Precio a consultar</b></p>`}
  <div class="fp-btns">
    <a class="btn wa" href="${whatsapp(cfg, msg)}" target="_blank" rel="noopener">${ICONO.wa}Reservar por WhatsApp</a>
    <a class="btn outline" href="#contactForm" data-quote>Pedir presupuesto por email</a>
  </div>
  <p class="fp-nota">Precios por persona, sujetos a disponibilidad y a cambios de tarifas hasta la confirmación de la reserva.</p>
</aside>`;
}

export function cuerpoPaquete(p: Paquete, d: DatosSitio) {
  const o = d.ofertas.find(x => x.paqueteId === p.id);
  const salidas = proximasSalidas(p);
  const otros = [...d.paquetes.filter(x => x.id !== p.id && x.region === p.region), ...d.paquetes.filter(x => x.id !== p.id && x.region !== p.region)].slice(0, 3);
  const ofertaDe = new Map(d.ofertas.map(x => [x.paqueteId, x]));
  const destinos = [...new Set(d.paquetes.map(x => x.destino || x.nombre))];
  const estrellas = p.estrellas > 0 ? '★'.repeat(Math.min(5, p.estrellas)) : '';

  return html`
<section class="paper ficha-top" data-doodles="6">
  <div class="wrap">
    <nav class="migas" aria-label="Ruta de navegación"><a href="/">Inicio</a><span aria-hidden="true">/</span><a href="/#paquetes">Paquetes</a><span aria-hidden="true">/</span><span aria-current="page">${p.nombre}</span></nav>
    <p class="eyebrow">${[p.pais, REGIONES[p.region], p.tipo].filter(Boolean).join(' · ')}</p>
    <h1 class="h2 ficha-titulo">${p.nombre}</h1>
    <ul class="ficha-chips">
      <li>${p.noches} noches</li>
      ${p.regimen ? html`<li>${p.regimen}</li>` : ''}
      <li>${p.transporte || 'Aéreo'} desde ${p.salidaDesde || 'Córdoba'}</li>
      ${p.hotel ? html`<li>${p.hotel}${estrellas ? html` <span class="estrellas" aria-label="${p.estrellas} estrellas">${estrellas}</span>` : ''}</li>` : ''}
    </ul>
  </div>
</section>

<section class="paper ficha" aria-label="Detalle del paquete">
  <div class="wrap ficha-grid">
    <div class="ficha-main">
      ${galeria(p)}
      <div class="ficha-bloque">
        <h2>El viaje</h2>
        ${p.descripcion ? parrafos(p.descripcion) : html`<p>${p.resumen}</p>`}
      </div>
      ${p.itinerario.length ? html`<div class="ficha-bloque">
        <h2>Itinerario</h2>
        <ol class="itin">${p.itinerario.map((dia, i) => html`<li><span class="itin-n">${i + 1}</span><div><h3>${dia.t}</h3>${dia.d ? html`<p>${dia.d}</p>` : ''}</div></li>`)}</ol>
      </div>` : ''}
      ${p.incluye.length || p.noIncluye.length ? html`<div class="ficha-bloque incluye">
        ${p.incluye.length ? html`<div><h2>Incluye</h2><ul class="lista-si">${p.incluye.map(t => html`<li>${t}</li>`)}</ul></div>` : ''}
        ${p.noIncluye.length ? html`<div><h2>No incluye</h2><ul class="lista-no">${p.noIncluye.map(t => html`<li>${t}</li>`)}</ul></div>` : ''}
      </div>` : ''}
      ${salidas.length ? html`<div class="ficha-bloque">
        <h2>Próximas salidas</h2>
        <div class="dates grandes">${salidas.map(s => html`<span title="${fechaLarga(s)}">${fechaCorta(s)}</span>`)}</div>
      </div>` : ''}
    </div>
    ${cajaPrecio(p, d, o)}
  </div>
</section>

<section class="paper sec" id="contacto" aria-labelledby="co-title" data-doodles="6" style="padding-top:0">
  <div class="wrap">
    <div class="sec-head">
      <div>
        <p class="eyebrow">Presupuesto</p>
        <h2 class="h2" id="co-title">¿Te lo armamos<br><em>a tu medida?</em></h2>
      </div>
      <p class="lede">Contanos cuántos viajan y en qué fecha. Te respondemos con el precio final en el día.</p>
    </div>
    <div class="contact solo">${formularioConsulta(destinos, p.destino || p.nombre, !!process.env.TURNSTILE_SITE_KEY)}</div>
  </div>
</section>

${otros.length ? html`<section class="paper sec" aria-labelledby="otros-title" style="padding-top:0">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">Seguí explorando</p><h2 class="h2" id="otros-title">Otros viajes<br><em>que te pueden gustar.</em></h2></div></div>
    <div class="grid" id="pkGrid">${otros.map(x => tarjetaPaquete(x, d.cfg, ofertaDe.get(x.id)))}</div>
  </div>
</section>` : ''}`;
}
