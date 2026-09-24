import type { ConfigDatos, Paquete } from '@/lib/db/schema';
import { direccionCompleta, REGIONES, telHref, whatsapp } from '@/lib/formato';
import { html, raw, type Crudo } from '@/lib/html';

export const ICONO = {
  wa: raw('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 11.5a8.5 8.5 0 0 1-12.4 7.6L3 20.5l1.5-4.4A8.5 8.5 0 1 1 20 11.5Z"/><path d="M9 8.8c.3 2.6 2.4 4.8 5.2 5.4l1-1.3 2 .9-.4 1.6c-3.8.4-8.3-3.4-8.6-7.6l1.6-.5.9 2Z" fill="currentColor" stroke="none"/></svg>'),
  flecha: raw('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'),
  avion: raw('<svg viewBox="0 0 64 64" aria-hidden="true"><use href="#d-plane"/></svg>'),
  candado: raw('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>'),
  check: raw('<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="var(--red)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'),
  google: raw('<svg class="g-logo" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.4-4.7 7.1l7.6 5.9c4.4-4.1 6.8-10.1 6.8-17.4z"/><path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>'),
};

const MARCA = raw('<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><circle class="bm-sun" cx="16" cy="13" r="6.5"/><path d="M2 20c3.5 0 3.5-2.4 7-2.4s3.5 2.4 7 2.4 3.5-2.4 7-2.4 3.5 2.4 7 2.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M2 25.5c3.5 0 3.5-2.4 7-2.4s3.5 2.4 7 2.4 3.5-2.4 7-2.4 3.5 2.4 7 2.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" opacity=".55"/></svg>');

export function marca(cfg: ConfigDatos, href: string, extra: { clase?: string; estilo?: string } = {}) {
  const nombre = cfg.agencia.nombre;
  return html`<a class="brand${extra.clase ? ' ' + extra.clase : ''}" href="${href}" aria-label="${nombre}, inicio"${extra.estilo ? raw(` style="${extra.estilo}"`) : ''}>${cfg.logo
    ? html`<img class="brand-logo" src="${cfg.logo}" alt="${nombre}">`
    : html`${MARCA}<span>${nombre}</span>`}</a>`;
}

/** Enlaces del menú: en la portada son anclas, en otras páginas vuelven a la portada. */
const SECCIONES = [['destinos', 'Destinos'], ['ofertas', 'Ofertas'], ['paquetes', 'Paquetes'], ['como-trabajamos', 'Cómo trabajamos'], ['contacto', 'Contacto']];

export function navegacion(cfg: ConfigDatos, enInicio: boolean) {
  const pre = enInicio ? '#' : '/#';
  const wa = whatsapp(cfg, 'Hola! Quiero hacer una consulta de viaje.');
  return html`
<header class="nav${enInicio ? '' : ' solid'}" id="nav"${enInicio ? '' : raw(' data-fija')}>
  <div class="wrap">
    <nav class="nav-in" aria-label="Principal">
      ${marca(cfg, enInicio ? '#inicio' : '/')}
      <ul class="nav-links">
        ${SECCIONES.map(([id, t]) => html`<li><a href="${pre}${id}">${t}</a></li>`)}
      </ul>
      <div class="nav-cta">
        <a class="btn ghost" href="#contactForm" data-quote>Pedir presupuesto</a>
        <a class="btn wa" href="${wa}" target="_blank" rel="noopener">${ICONO.wa}WhatsApp</a>
        <button class="burger" id="burger" aria-label="Abrir menú" aria-expanded="false" aria-controls="menu"><span></span><span></span></button>
      </div>
    </nav>
  </div>
</header>
<div class="menu" id="menu" aria-hidden="true">
  <button class="menu-close" id="menuClose" aria-label="Cerrar menú">✕</button>
  ${[...SECCIONES.slice(0, 4), ['preguntas', 'Preguntas'], SECCIONES[4]].map(([id, t]) => html`<a href="${pre}${id}">${t}</a>`)}<a href="#contactForm" data-quote>Pedir presupuesto</a>
</div>`;
}

/** Países de los paquetes publicados, para el pie. */
function paises(pqs: Paquete[]) {
  const m = new Map<string, string>();
  for (const p of pqs) { const pais = (p.pais || '').split(', ').pop()!.trim(); if (pais && !m.has(pais)) m.set(pais, p.region); }
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'));
}

export function pie(cfg: ConfigDatos, pqs: Paquete[], enInicio: boolean) {
  const a = cfg.agencia;
  const pre = enInicio ? '#' : '/#';
  const primeraPalabra = a.nombre.split(' ')[0];
  return html`
<footer class="foot" aria-labelledby="club-title" data-doodles="8">
  <div class="wrap club">
    <div>
      <p class="eyebrow">Club ${primeraPalabra}</p>
      <h2 class="h2" id="club-title">Las ofertas de último minuto,<br><em>antes que nadie.</em></h2>
    </div>
    <form id="clubForm" novalidate>
      <label class="sr-only" for="club-email">Tu email</label>
      <div class="hp" aria-hidden="true"><input name="web" tabindex="-1" autocomplete="off"></div>
      <input id="club-email" name="email" type="email" placeholder="tu@email.com" autocomplete="email" required maxlength="160">
      <button class="btn light" type="submit">Sumarme</button>
    </form>
  </div>
  <div class="wrap foot-top">
    ${marca(cfg, enInicio ? '#inicio' : '/', { estilo: 'color:#fff;--mark:#ffe2b0' })}
    <div class="social">
      ${a.instagram ? html`<a href="${a.instagram}" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>` : ''}
      ${a.facebook ? html`<a href="${a.facebook}" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21z"/></svg></a>` : ''}
    </div>
  </div>
  <div class="wrap foot-grid">
    <div><h4>Destinos</h4><ul>${paises(pqs).map(([pais, reg]) => html`<li><a href="${pre}paquetes" data-pick="${reg}" title="${REGIONES[reg] || ''}">${pais}</a></li>`)}</ul></div>
    <div><h4>Páginas</h4><ul><li><a href="${enInicio ? '#inicio' : '/'}">Inicio</a></li><li><a href="${pre}paquetes">Paquetes</a></li><li><a href="${pre}ofertas">Ofertas</a></li><li><a href="${pre}por-que-elegirnos">Por qué elegirnos</a></li><li><a href="${pre}preguntas">Preguntas frecuentes</a></li><li><a href="${pre}contacto">Contacto</a></li></ul></div>
    <div><h4>Contacto</h4><ul class="c-list">
      <li><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg><span>${direccionCompleta(cfg)}</span></li>
      <li><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg><a href="${telHref(a.telefono)}">${a.telefono}</a></li>
      <li><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg><a href="mailto:${a.email}">${a.email}</a></li>
      <li><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span>${a.horario}</span></li>
    </ul></div>
    <div class="reg-card">
      <div class="reg-head"><span class="reg-ic"><svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M24 4l16 6v12c0 10-7 18-16 22C15 40 8 32 8 22V10z"/><path d="M16 24l6 6 10-12" stroke-linecap="round"/></svg></span><div><b>Agencia registrada</b><small>Registro de Agentes de Viajes</small></div></div>
      <ul>
        <li>${ICONO.check}<span>Legajo EVyT N° ${a.legajo}</span></li>
        <li>${ICONO.check}<span>CUIT ${a.cuit}</span></li>
        <li>${ICONO.check}<span>Razón social: ${a.razonSocial}</span></li>
      </ul>
      ${cfg.dataFiscal.imagen || cfg.dataFiscal.enlace ? html`<a class="fiscal" href="${cfg.dataFiscal.enlace || 'https://www.arca.gob.ar/'}" target="_F960AFIPInfo" rel="noopener">${cfg.dataFiscal.imagen ? html`<img class="qr" src="${cfg.dataFiscal.imagen}" alt="Código QR de Data Fiscal" width="60" height="60" loading="lazy">` : ''}<small>Data Fiscal</small></a>` : ''}
    </div>
  </div>
  <div class="legal-bar">
    <div class="wrap legal">
      <div>© ${new Date().getFullYear()} ${a.nombre}. Todos los derechos reservados.</div>
      <nav class="legal-links" aria-label="Legales"><a href="/privacidad">Privacidad</a><a href="/terminos">Términos</a><a href="/cookies">Cookies</a><a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor" target="_blank" rel="noopener">Defensa del consumidor</a><a class="regret" href="/arrepentimiento">Botón de arrepentimiento</a></nav>
    </div>
  </div>
</footer>`;
}

export function extras(cfg: ConfigDatos) {
  return html`
<a class="wa-float" href="${whatsapp(cfg, 'Hola! Quiero hacer una consulta de viaje.')}" target="_blank" rel="noopener" aria-label="Escribinos por WhatsApp">${ICONO.wa}</a>
<div class="cookies" id="cookies" role="region" aria-label="Aviso de cookies" hidden>
  <p><b>Usamos cookies.</b> Las esenciales hacen funcionar el sitio. Con tu permiso sumamos analíticas para saber qué destinos buscan más. <a class="linkish" href="/cookies">Más información</a></p>
  <div class="row"><button class="ok" data-ck="all">Aceptar todas</button><button data-ck="essential">Solo esenciales</button></div>
</div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>`;
}

/** Formulario de presupuesto (portada y ficha de paquete). */
export function formularioConsulta(destinos: string[], elegido = '', conTurnstile = false): Crudo {
  const hoy = new Date();
  const min = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  return html`
<form class="form" id="contactForm" novalidate>
  <h3>Pedí tu presupuesto</h3>
  <div class="hp" aria-hidden="true"><label for="c-web">No completar</label><input id="c-web" name="web" tabindex="-1" autocomplete="off"></div>
  <div class="field"><label for="c-nombre">Nombre y apellido</label><input id="c-nombre" name="nombre" autocomplete="name" required maxlength="80"><span class="err" data-for="c-nombre"></span></div>
  <div class="field"><label for="c-tel">Teléfono o WhatsApp</label><input id="c-tel" name="tel" type="tel" autocomplete="tel" inputmode="tel" required maxlength="30"><span class="err" data-for="c-tel"></span></div>
  <div class="field full"><label for="c-email">Email</label><input id="c-email" name="email" type="email" autocomplete="email" required maxlength="120"><span class="err" data-for="c-email"></span></div>
  <div class="field"><label for="c-dest">Destino</label><select id="c-dest" name="destino"><option>Todavía no sé</option>${destinos.map(d => html`<option${d === elegido ? raw(' selected') : ''}>${d}</option>`)}</select></div>
  <div class="field"><label for="c-fecha">¿Cuándo querés viajar?</label><input id="c-fecha" name="fecha" type="month" min="${min}"></div>
  <div class="field full"><label for="c-msg">Contanos un poco más</label><textarea id="c-msg" name="mensaje" maxlength="1500" placeholder="Somos dos adultos, queremos all inclusive y playa tranquila…"></textarea></div>
  <label class="consent" for="c-ok"><input type="checkbox" id="c-ok" required><span>Acepto la <a class="linkish" href="/privacidad" target="_blank">política de privacidad</a> y que me contacten por este pedido.</span></label>
  ${conTurnstile ? raw('<div class="field full" data-turnstile="contacto"></div>') : ''}
  <div class="form-foot">
    <span class="secure">${ICONO.candado}Conexión cifrada · protección anti-spam</span>
    <button class="btn" type="submit">Enviar consulta</button>
  </div>
</form>`;
}
