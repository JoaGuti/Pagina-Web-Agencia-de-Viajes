import { CIFRAS, PASOS, POR_QUE, PREGUNTAS, respuesta, TEXTOS } from '@/contenido/sitio';
import type { DatosSitio } from '@/lib/datos';
import { direccionCompleta, enPalabras, mesAnio, numero, proximasSalidas, REGIONES } from '@/lib/formato';
import { html, raw } from '@/lib/html';
import { coordenadas } from '@/lib/seo';
import { ICONO, formularioConsulta } from './partes';
import { postal, tarjetaOferta, tarjetaPaquete, tarjetaResena } from './tarjetas';

export function cuerpoInicio(d: DatosSitio) {
  const { cfg, paquetes: pqs, ofertas, resenas } = d;
  const a = cfg.agencia;
  const regiones = [...new Set(pqs.map(p => p.region))].filter(r => REGIONES[r]);
  const meses = [...new Set(pqs.flatMap(p => proximasSalidas(p).map(s => s.slice(0, 7))))].sort().slice(0, 8);
  const ofertaDe = new Map(ofertas.map(o => [o.paqueteId, o]));
  const destinos = [...new Set(pqs.map(p => p.destino || p.nombre))];
  const dir = direccionCompleta(cfg);
  const mapa = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dir)}`;
  const perfil = cfg.resenas.perfil || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.nombre + ' ' + a.ciudad)}`;
  const puntaje = cfg.resenas.puntaje.toFixed(1).replace('.', ',');
  const bajadaOfertas = ofertas.length > 1
    ? `${ofertas.length} ofertas vigentes. Cupos liberados por hoteles y aerolíneas: cuando vence cada una, vuelve el precio normal.`
    : ofertas.length ? 'Cupos liberados por hoteles y aerolíneas. Cuando se termina el contador, vuelve el precio normal.'
      : `Esta semana no hay ofertas. Sumate al Club ${a.nombre.split(' ')[0]} y te avisamos primero.`;

  return html`
  <section class="hero" id="inicio" aria-label="Portada">
    <div class="hero-stage" id="heroStage">
      <div class="hero-media" aria-hidden="true"><video id="heroVid" muted loop playsinline preload="auto" poster="/media/hero-playa.jpg"></video></div>
      <canvas id="scene" aria-hidden="true"></canvas>
      <div class="hero-scrim" aria-hidden="true"></div>
      <div class="hero-copy">
        <div class="wrap">
          <p class="eyebrow">${TEXTOS.eyebrowPortada}</p>
          <h1 class="hero-title" id="heroTitle"><span class="l1">${TEXTOS.heroLinea1}</span> <span class="l2">${TEXTOS.heroLinea2}</span></h1>
          <p class="hero-sub">${TEXTOS.heroBajada}</p>
          <div class="hero-cta">
            <a class="btn" href="#paquetes">Ver paquetes ${ICONO.flecha}</a>
            <a class="btn ghost" href="#ofertas">Ofertas de la semana</a>
          </div>
        </div>
      </div>
      <div class="finder">
        <div class="wrap">
          <form id="finder" role="search" aria-label="Buscar paquetes">
            <label for="f-dest"><span>Destino</span><select id="f-dest"><option value="todos">Todos los destinos</option>${regiones.map(r => html`<option value="${r}">${REGIONES[r]}</option>`)}</select></label>
            <label for="f-mes"><span>Mes de salida</span><select id="f-mes"><option value="">Cualquier mes</option>${meses.map(m => html`<option value="${m}">${mesAnio(m).replace(/^./, c => c.toUpperCase())}</option>`)}</select></label>
            <label for="f-pax"><span>Pasajeros</span><select id="f-pax"><option>2 adultos</option><option>1 adulto</option><option>2 adultos + 1 menor</option><option>2 adultos + 2 menores</option><option>Grupo (6 o más)</option></select></label>
            <button class="btn" type="submit">Buscar</button>
          </form>
        </div>
      </div>
      <div class="scroll-hint" aria-hidden="true">Deslizá para explorar</div>
      <div class="hero-edge" aria-hidden="true">
        <svg class="arc" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <defs><mask id="edgeMask" maskUnits="userSpaceOnUse" x="-60" y="-80" width="1560" height="220"><path id="edgeReveal" d="M-30 60 Q720 -50 1470 60" fill="none" stroke="#fff" stroke-width="14"/></mask></defs>
          <path d="M0 121 L0 72 Q720 -28 1440 72 L1440 121 Z" fill="#ffffff"/>
          <path id="edgePath" d="M-30 60 Q720 -50 1470 60" fill="none" stroke="#fff" stroke-width="2.2" stroke-dasharray="7 8" stroke-linecap="round" mask="url(#edgeMask)" vector-effect="non-scaling-stroke"/>
        </svg>
        <span class="edge-plane" id="edgePlane"><svg viewBox="0 0 64 64"><use href="#d-plane"/></svg></span>
      </div>
    </div>
  </section>

  ${pqs.length ? html`
  <section class="dest paper" id="destinos" aria-labelledby="dest-title" data-doodles="9">
    <div class="dest-pin">
      <div class="wrap dest-head">
        <div>
          <p class="eyebrow">Destinos</p>
          <h2 class="h2" id="dest-title">${enPalabras(pqs.length)} ${pqs.length === 1 ? 'postal' : 'postales'}<br><em>esperando tu firma.</em></h2>
        </div>
        <p class="lede">Elegimos cada destino porque ya lo recorrimos. Te decimos qué playa conviene según el mes, cuál hotel vale lo que cuesta y dónde comer sin turistas.</p>
      </div>
      <div class="dest-track" id="destTrack">${pqs.map(p => postal(p, cfg))}</div>
      <div class="dest-progress" aria-hidden="true"><span id="destBar"></span></div>
    </div>
  </section>` : ''}

  <section class="paper sec" id="ofertas" aria-labelledby="of-title" data-doodles="6">
    <div class="wrap">
      <div class="sec-head">
        <div>
          <p class="eyebrow">Oferta relámpago</p>
          <h2 class="h2" id="of-title">Salís en pocas semanas.<br><em>Pagás mucho menos.</em></h2>
        </div>
        <p class="lede">${bajadaOfertas}</p>
      </div>
      ${ofertas.length ? html`<div id="offer" class="offer-list">${ofertas.map(o => tarjetaOferta(o, cfg))}</div>` : ''}
    </div>
  </section>

  <section class="paper sec" id="paquetes" aria-labelledby="pk-title" data-doodles="10" style="padding-top:0">
    <div class="wrap">
      <div class="sec-head">
        <div>
          <p class="eyebrow">Paquetes</p>
          <h2 class="h2" id="pk-title">Todo resuelto,<br><em>de Córdoba a la arena.</em></h2>
        </div>
        ${regiones.length > 1 ? html`<div class="filters" role="group" aria-label="Filtrar por región" id="filters">
          <button type="button" aria-pressed="true" data-f="todos">Todos</button>
          ${regiones.map(r => html`<button type="button" aria-pressed="false" data-f="${r}">${REGIONES[r]}</button>`)}
        </div>` : ''}
      </div>
      <div class="grid" id="pkGrid">${pqs.map(p => tarjetaPaquete(p, cfg, ofertaDe.get(p.id)))}</div>
      <p class="pk-vacio" id="pkVacio"${pqs.length ? raw(' hidden') : ''}>No hay paquetes con esa búsqueda por ahora. <a href="#contactForm" data-quote>Pedinos un presupuesto a medida</a> y lo armamos.</p>
    </div>
  </section>

  <section class="paper sec why" id="por-que-elegirnos" aria-labelledby="why-title" style="padding-top:0">
    <svg class="why-lines" viewBox="0 0 1440 760" preserveAspectRatio="none" aria-hidden="true"><path d="M-40 120 C 160 40 260 260 120 360 S 40 620 260 700"/><path d="M520 30 C 640 -10 760 90 700 150"/></svg>
    <span class="why-suitcase" aria-hidden="true"><svg viewBox="0 0 64 64"><use href="#d-suitcase"/></svg></span>
    <span class="why-balloon" aria-hidden="true"><svg viewBox="0 0 64 64"><use href="#d-balloon"/></svg></span>
    <div class="wrap why-grid">
      <div>
        <span class="why-pill"><svg viewBox="0 0 64 64" aria-hidden="true"><use href="#d-plane"/></svg>Por qué elegirnos</span>
        <h2 class="h2" id="why-title">Estamos con vos,<br><em>así de simple.</em></h2>
        <ul class="feats">${POR_QUE.map(f => html`<li><span class="f-ic"><svg viewBox="0 0 64 64" aria-hidden="true"><use href="#d-${f.icono}"/></svg></span><div><b>${f.titulo}</b><span>${f.texto}</span></div></li>`)}</ul>
      </div>
      <div class="circles" aria-hidden="true">
        <span class="blob"></span>
        <figure class="c big"><img src="/media/fotos/pareja-playa.jpg" alt="" loading="lazy" decoding="async"></figure>
        <span class="c-palm"><svg viewBox="0 0 64 64"><use href="#d-palm"/></svg></span>
      </div>
    </div>
  </section>

  <section class="paper sec" id="como-trabajamos" aria-labelledby="ct-title" data-doodles="7" style="padding-top:0">
    <div class="wrap">
      <div class="sec-head">
        <div>
          <p class="eyebrow">Cómo trabajamos</p>
          <h2 class="h2" id="ct-title">De la primera charla<br><em>al check-in.</em></h2>
        </div>
        <p class="lede">Una sola persona te acompaña en todo el viaje. Si algo cambia, te avisamos antes que la aerolínea.</p>
      </div>
      <div class="route" id="route">
        <svg class="path" viewBox="0 0 1200 120" aria-hidden="true">
          <path id="routePath" d="M26 40 C180 110 300 -20 420 40 S660 110 820 40 S1060 -20 1180 40" fill="none" stroke="#d62839" stroke-width="2" stroke-dasharray="6 8" opacity=".3"/>
          <path id="routeDraw" d="M26 40 C180 110 300 -20 420 40 S660 110 820 40 S1060 -20 1180 40" fill="none" stroke="#d62839" stroke-width="2.5" stroke-linecap="round"/>
          <g id="plane"><circle r="17" fill="#d62839"/><use href="#d-plane" x="-12" y="-12" width="24" height="24" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></g>
        </svg>
        <ol class="steps">${PASOS.map((s, i) => html`<li class="step"><span class="step-n">${i + 1}</span><h3>${s.titulo}</h3><p>${s.texto(a.direccion)}</p></li>`)}</ol>
      </div>
      <div class="stats" id="stats">
        ${CIFRAS.map(c => html`<div class="stat"><b data-count="${c.valor}">${numero(c.valor)}</b><span>${c.texto}</span></div>`)}
        <div class="stat"><b data-count="${cfg.resenas.puntaje}" data-dec="1">${puntaje}</b><span>de puntaje en Google</span></div>
      </div>
    </div>
  </section>

  ${resenas.length ? html`
  <section class="reviews paper" aria-labelledby="rv-title" data-doodles="4">
    <div class="wrap sec-head">
      <div>
        <p class="eyebrow">Viajeros</p>
        <h2 class="h2" id="rv-title">Volvieron bronceados<br><em>y lo contaron.</em></h2>
      </div>
      <div class="rv-summary">
        ${ICONO.google}
        <div>
          <div class="rv-score"><b>${puntaje}</b><span class="rv-stars" aria-label="${puntaje} de 5 estrellas">★★★★★</span></div>
          <small>${numero(cfg.resenas.cantidad)} reseñas en Google</small>
        </div>
        <a class="btn outline" href="${perfil}" target="_blank" rel="noopener">Dejanos tu reseña</a>
      </div>
    </div>
    <div class="mq-wrap"><div class="marquee" id="mq1">${resenas.map(tarjetaResena)}${raw('<div class="mq-copia" aria-hidden="true" style="display:contents">')}${resenas.map(tarjetaResena)}${raw('</div>')}</div></div>
  </section>` : ''}

  <section class="paper sec" id="preguntas" aria-labelledby="faq-title" data-doodles="7">
    <div class="wrap faq">
      <div>
        <p class="eyebrow">Preguntas frecuentes</p>
        <h2 class="h2" id="faq-title">Lo que todos<br><em>nos preguntan.</em></h2>
        <p class="lede" style="color:var(--ink-2);opacity:1">¿Tu duda no está? Escribinos y te respondemos en el día.</p>
      </div>
      <div>${PREGUNTAS.map((q, i) => html`<details${i === 0 ? raw(' open') : ''}><summary>${q.p}<i aria-hidden="true"></i></summary><p>${respuesta(q, dir, a.horario)}</p></details>`)}</div>
    </div>
  </section>

  <section class="paper sec" id="contacto" aria-labelledby="co-title" data-doodles="8" style="padding-top:0">
    <div class="wrap">
      <div class="sec-head">
        <div>
          <p class="eyebrow">Contacto</p>
          <h2 class="h2" id="co-title">${TEXTOS.contactoTitulo[0]}<br><em>${TEXTOS.contactoTitulo[1]}</em></h2>
        </div>
        <p class="lede">${TEXTOS.contactoBajada}</p>
      </div>
      <div class="contact">
        ${formularioConsulta(destinos, '', !!process.env.TURNSTILE_SITE_KEY)}
        <div class="mapbox" id="mapbox">
          <canvas id="mapCanvas" aria-hidden="true"></canvas>
          <span class="map-coord">${coordenadas(a.lat, a.lng)}${TEXTOS.mapaAltura ? ' · ' + TEXTOS.mapaAltura : ''}</span>
          <div class="map-card">
            <h3>${a.nombre}</h3>
            <address>${a.direccion}, ${a.ciudad}, ${a.provincia}${a.cp ? ` (${a.cp})` : ''}</address>
            <div class="map-meta"><span>${a.horario}</span>${TEXTOS.mapaNota ? html`<span>${TEXTOS.mapaNota}</span>` : ''}</div>
            <div class="row">
              <a class="btn" id="mapGo" href="${mapa}" target="_blank" rel="noopener">Cómo llegar</a>
              <button class="btn outline" type="button" id="copyAddr">Copiar dirección</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}
