import { dinero, duracion, fechaCorta, fechaLarga, REGIONES, whatsapp } from '@/lib/formato';
import { ETIQUETA_UNIDAD } from '@/lib/kuro';
import { html } from '@/lib/html';
import type { DatosSitio, OfertaVista, SalidaVista, Viaje } from '@/lib/sitio/modelo';
import { ICONO, formularioConsulta } from './partes';
import { etiqueta, foto, tarjetaPaquete } from './tarjetas';

const parrafos = (t: string) => t.split(/\n{2,}|\r\n\r\n/).map(s => s.trim()).filter(Boolean).map(s => html`<p>${s}</p>`);
/** Estado visible de una salida: lo que Kuro informa, o «Consulta cerrada» si ya no se puede consultar. */
function estado(s: SalidaVista) {
  if (s.disponibilidad === 'agotado') return 'Agotada';
  if (s.disponibilidad === 'cerrado') return 'Cerrada';
  if (!s.consultable) return 'Consulta cerrada';
  return s.disponibilidad === 'disponible_informado' ? 'Disponible' : 'Disponibilidad a confirmar';
}

function galeria(v: Viaje) {
  const fotos = v.fotos;
  if (fotos.length <= 1) return html`<div class="galeria una"><figure class="g-main">${foto(v, '(max-width: 900px) 100vw, 760px', { prioridad: true })}${etiqueta(v)}</figure></div>`;
  return html`<div class="galeria" id="galeria">
    <figure class="g-main">${foto(v, '(max-width: 900px) 100vw, 760px', { prioridad: true })}${etiqueta(v)}</figure>
    <div class="g-thumbs" role="list">${fotos.slice(0, 8).map((f, i) => html`<button type="button" role="listitem" class="g-th${i === 0 ? ' on' : ''}" data-foto="${f.url}" aria-label="Ver foto ${i + 1} de ${fotos.length}">${foto(v, '160px', { i })}</button>`)}</div>
  </div>`;
}

function cajaPrecio(v: Viaje, d: DatosSitio, o?: OfertaVista) {
  const { sitio } = d;
  const msg = v.contenido?.ctaWhatsapp || `Hola! Quiero reservar el paquete "${v.nombre}".`;
  const wa = whatsapp(sitio, msg);
  return html`
<aside class="ficha-precio" aria-label="Precio y reserva">
  ${o ? html`<p class="fp-oferta"><span>${o.etiqueta}</span>${o.vence ? (o.contador ? html`<span class="fp-vence" data-vence="${o.vence.toISOString()}">vence el ${fechaLarga(o.vence, sitio.zonaHoraria)}</span>` : html`<span>hasta el ${fechaLarga(o.vence, sitio.zonaHoraria)}</span>`) : ''}</p>${o.precio ? html`<p class="fp-desde">Precio de la oferta</p><p class="fp-precio">${o.precioAnterior ? html`<s>${dinero(o.precioAnterior)}</s>` : ''}<b>${dinero(o.precio)}</b></p>${o.nota ? html`<p class="fp-ars">${o.nota}</p>` : ''}` : ''}` : ''}
  ${v.precioDesde ? html`
  <p class="fp-desde">Tarifa desde</p>
  <p class="fp-precio"><b>${dinero(v.precioDesde)}</b></p>
  <p class="fp-ars">${ETIQUETA_UNIDAD[v.precioDesde.unit]}</p>` : html`<p class="fp-precio"><b>Precio a consultar</b></p>`}
  <ul class="fp-cond">
    ${v.cuotas ? html`<li>${ICONO.check}En ${v.cuotas} cuotas</li>` : ''}
    ${v.deposito != null ? html`<li>${ICONO.check}Reservás con el ${v.deposito}% de depósito</li>` : ''}
    ${v.grupo ? html`<li>${ICONO.check}Grupo: ${v.grupo}</li>` : ''}
  </ul>
  <div class="fp-btns">
    ${wa ? html`<a class="btn wa" href="${wa}" target="_blank" rel="noopener">${ICONO.wa}Reservar por WhatsApp</a>` : ''}
    <a class="btn outline" href="#contactForm" data-quote>${v.contenido?.ctaTexto || 'Pedir presupuesto por email'}</a>
  </div>
  <p class="fp-nota">El precio depende de la salida, del tipo de habitación y de la disponibilidad. Consultá las condiciones antes de reservar.</p>
</aside>`;
}

function salidas(v: Viaje) {
  if (!v.salidas.length) return '';
  return html`<div class="ficha-bloque">
    <h2>Salidas y tarifas</h2>
    <div class="salidas">${v.salidas.map(s => html`
      <article class="salida${s.consultable ? '' : ' cerrada'}">
        <header><b>${fechaLarga(s.inicio)}${s.fin !== s.inicio ? html` <span aria-hidden="true">→</span> ${fechaLarga(s.fin)}` : ''}</b><span class="estado ${s.consultable ? 'ok' : 'no'}">${estado(s)}</span></header>
        ${s.limiteConsulta ? html`<small>Consultas hasta el ${fechaLarga(s.limiteConsulta)}</small>` : ''}
        ${s.tarifas.length ? html`<table class="tarifas"><thead><tr><th scope="col">Tarifa</th><th scope="col">Precio</th><th scope="col">Vigencia</th></tr></thead><tbody>${s.tarifas.map(t => html`<tr><td>${t.etiqueta}<small>${ETIQUETA_UNIDAD[t.unidad]}</small></td><td><b>${dinero(t.precio)}</b><small>${t.impuestosIncluidos ? 'Impuestos incluidos' : 'No incluye impuestos'}${t.notaImpuestos ? ': ' + t.notaImpuestos : ''}</small></td><td>${fechaCorta(t.desde)} – ${fechaCorta(t.hasta)}</td></tr>`)}</tbody></table>` : html`<p class="sin-tarifa">Tarifa a consultar.</p>`}
      </article>`)}</div>
  </div>`;
}

function hoteles(v: Viaje) {
  if (!v.hoteles.length) return '';
  return html`<div class="ficha-bloque">
    <h2>Alojamiento</h2>
    <ul class="hoteles">${v.hoteles.map(h => html`<li><b>${h.nombre}${h.estrellas ? html` <span class="estrellas" aria-label="${h.estrellas} estrellas">${'★'.repeat(Math.min(7, Math.round(h.estrellas)))}</span>` : ''}</b><span>${[h.ciudad, h.noches ? `${h.noches} noches` : null, h.regimen].filter(Boolean).join(' · ')}</span></li>`)}</ul>
  </div>`;
}

function datosViaje(v: Viaje) {
  const filas: [string, string][] = ([
    ['Forma de pago', v.pago], ['Requisitos', v.requisitos], ['Punto de encuentro', v.puntoEncuentro], ['Tamaño del grupo', v.grupo], ['Consejos', v.consejos],
  ] as [string, string | null][]).filter((f): f is [string, string] => !!f[1]);
  if (!filas.length && !v.condiciones && !v.opcionales.length) return '';
  return html`<div class="ficha-bloque">
    ${v.condiciones ? html`<h2>Condiciones</h2>${parrafos(v.condiciones)}` : ''}
    ${filas.length ? html`<dl class="datos-viaje">${filas.map(([k, t]) => html`<div><dt>${k}</dt><dd>${t}</dd></div>`)}</dl>` : ''}
    ${v.opcionales.length ? html`<h3 class="sub">Opcionales</h3><ul class="opcionales">${v.opcionales.map(o => html`<li><span>${o.nombre}</span><b>${o.precio ? dinero(o.precio) : 'Consultar'}</b></li>`)}</ul>` : ''}
  </div>`;
}

function contenidoExtra(v: Viaje) {
  const c = v.contenido;
  if (!c) return '';
  return html`
  ${c.fichas.length ? html`<div class="ficha-bloque"><h2>Ficha técnica</h2>${c.fichas.map(g => html`<h3 class="sub">${g.titulo}</h3><dl class="datos-viaje">${g.filas.map(f => html`<div><dt>${f.etiqueta}</dt><dd>${f.valor}</dd></div>`)}</dl>`)}</div>` : ''}
  ${c.documentos.length || c.video || c.recorrido ? html`<div class="ficha-bloque"><h2>Material</h2><ul class="enlaces">${c.video ? html`<li><a href="${c.video}" target="_blank" rel="noopener">Ver video</a></li>` : ''}${c.recorrido ? html`<li><a href="${c.recorrido}" target="_blank" rel="noopener">Recorrido virtual</a></li>` : ''}${c.documentos.map(d => html`<li><a href="${d.url}" target="_blank" rel="noopener">${d.etiqueta}</a></li>`)}</ul></div>` : ''}
  ${c.faqs.length ? html`<div class="ficha-bloque"><h2>Preguntas sobre este viaje</h2>${c.faqs.map(f => html`<details class="faq-pq"><summary>${f.pregunta}</summary><p>${f.respuesta}</p></details>`)}</div>` : ''}`;
}

export function cuerpoPaquete(v: Viaje, d: DatosSitio) {
  const o = d.ofertas.find(x => x.viaje?.id === v.id);
  const otros = [...d.viajes.filter(x => x.id !== v.id && x.region === v.region), ...d.viajes.filter(x => x.id !== v.id && x.region !== v.region)].slice(0, 3);
  const ofertaDe = new Map(d.ofertas.flatMap(x => (x.viaje ? [[x.viaje.id, x] as const] : [])));
  const dur = duracion(v);
  const c = v.contenido;

  return html`
<section class="paper ficha-top" data-doodles="6">
  <div class="wrap">
    <nav class="migas" aria-label="Ruta de navegación"><a href="/">Inicio</a><span aria-hidden="true">/</span><a href="/#paquetes">Paquetes</a><span aria-hidden="true">/</span><span aria-current="page">${v.nombre}</span></nav>
    <p class="eyebrow">${[v.destinos.join(', '), REGIONES[v.region]].filter(Boolean).join(' · ')}</p>
    <h1 class="h2 ficha-titulo">${v.nombre}</h1>
    ${c?.subtitulo ? html`<p class="ficha-sub">${c.subtitulo}</p>` : ''}
    <ul class="ficha-chips">
      ${dur ? html`<li>${dur}</li>` : ''}
      ${v.regimen ? html`<li>${v.regimen}</li>` : ''}
      <li>${v.modalidad}${v.origen ? ' desde ' + v.origen : ''}</li>
      ${c?.insignias.map(b => html`<li>${b}</li>`) ?? ''}
    </ul>
  </div>
</section>

<section class="paper ficha" aria-label="Detalle del paquete">
  <div class="wrap ficha-grid">
    <div class="ficha-main">
      ${galeria(v)}
      <div class="ficha-bloque">
        <h2>El viaje</h2>
        ${v.descripcion ? parrafos(v.descripcion) : v.resumen ? html`<p>${v.resumen}</p>` : ''}
        ${c?.destacados.length ? html`<ul class="lista-si">${c.destacados.map(t => html`<li>${t}</li>`)}</ul>` : ''}
      </div>
      ${v.itinerario.length ? html`<div class="ficha-bloque">
        <h2>Itinerario</h2>
        <ol class="itin">${v.itinerario.map((dia, i) => html`<li><span class="itin-n">${i + 1}</span><div><h3>${dia.titulo}</h3>${dia.descripcion ? html`<p>${dia.descripcion}</p>` : ''}</div></li>`)}</ol>
      </div>` : ''}
      ${hoteles(v)}
      ${v.incluye.length || v.noIncluye.length ? html`<div class="ficha-bloque incluye">
        ${v.incluye.length ? html`<div><h2>Incluye</h2><ul class="lista-si">${v.incluye.map(t => html`<li>${t}</li>`)}</ul></div>` : ''}
        ${v.noIncluye.length ? html`<div><h2>No incluye</h2><ul class="lista-no">${v.noIncluye.map(t => html`<li>${t}</li>`)}</ul></div>` : ''}
      </div>` : ''}
      ${salidas(v)}
      ${v.salidas.length ? '' : html`<div class="ficha-bloque"><h2>Salidas</h2><p>Por ahora no hay salidas publicadas. Pedinos un presupuesto y te contamos las próximas fechas.</p></div>`}
      ${datosViaje(v)}
      ${contenidoExtra(v)}
    </div>
    ${cajaPrecio(v, d, o)}
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
    <div class="contact solo">${formularioConsulta(d.viajes, v.id, !!process.env.TURNSTILE_SITE_KEY)}</div>
  </div>
</section>

${otros.length ? html`<section class="paper sec" aria-labelledby="otros-title" style="padding-top:0">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">Seguí explorando</p><h2 class="h2" id="otros-title">Otros viajes<br><em>que te pueden gustar.</em></h2></div></div>
    <div class="grid" id="pkGrid">${otros.map(x => tarjetaPaquete(x, d.sitio, ofertaDe.get(x.id)))}</div>
  </div>
</section>` : ''}`;
}
