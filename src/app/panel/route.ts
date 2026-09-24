import { leerConfig } from '@/lib/datos';
import type { ConfigDatos } from '@/lib/db/schema';
import { html, raw } from '@/lib/html';
import { REGLAS_CLAVE } from '@/lib/seguridad';
import { VERSION } from '@/plantillas/base';
import { SPRITE } from '@/plantillas/sprite';

export const dynamic = 'force-dynamic';

const MARCA = raw('<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="13" r="6.5" fill="#d62839"/><path d="M2 20c3.5 0 3.5-2.4 7-2.4s3.5 2.4 7 2.4 3.5-2.4 7-2.4 3.5 2.4 7 2.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M2 25.5c3.5 0 3.5-2.4 7-2.4s3.5 2.4 7 2.4 3.5-2.4 7-2.4 3.5 2.4 7 2.4" fill="none" stroke="currentColor" opacity=".55" stroke-width="2.2" stroke-linecap="round"/></svg>');
const IC = (d: string) => raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${d}</svg>`);
const ICONOS = {
  resumen: IC('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
  paquetes: IC('<path d="M3 7h18v13H3zM8 7V4h8v3"/>'),
  ofertas: IC('<path d="M20 12l-8 8-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),
  consultas: IC('<path d="M4 4h16v12H8l-4 4z"/>'),
  resenas: IC('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),
  config: IC('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 14H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 3V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 10h.1a2 2 0 1 1 0 4z"/>'),
  usuarios: IC('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .7 3.2 2.5 3.5 5.2"/>'),
};

const logoLogin = (cfg: ConfigDatos) => html`<div class="slot">${cfg.logo ? html`<img src="${cfg.logo}" alt="Logo de ${cfg.agencia.nombre}">` : MARCA}</div>${cfg.logo ? '' : html`<h2>${cfg.agencia.nombre}</h2>`}<p>Panel de gestión de la web.</p>`;

const reglas = (id: string) => html`<ul class="rules" id="${id}" aria-live="polite">${REGLAS_CLAVE.map(r => html`<li data-r="${r.id}">${r.texto[0].toUpperCase() + r.texto.slice(1)}</li>`)}</ul>`;

export async function GET() {
  let cfg: ConfigDatos | null = null;
  try { cfg = await leerConfig(); } catch (e) { console.error(e); }
  const nombre = cfg?.agencia.nombre || 'Panel';
  const pagina = '<!doctype html>' + html`
<html lang="es-AR" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Panel · ${nombre}</title>
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<link rel="icon" href="${cfg?.logo || '/favicon.svg'}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Carlito:ital,wght@0,400;0,700;1,400;1,700&display=swap">
<link rel="stylesheet" href="/assets/panel.css?v=${VERSION}">
</head>
<body>
${raw(SPRITE)}
<section class="login" id="login" aria-labelledby="lg-t" hidden>
  <div class="login-brand">
    <span class="dd" style="left:10%;top:12%;width:74px;height:74px;--r:-12deg"><svg viewBox="0 0 64 64"><use href="#d-plane"/></svg></span>
    <span class="dd" style="left:74%;top:14%;width:62px;height:62px;--r:10deg"><svg viewBox="0 0 64 64"><use href="#d-map"/></svg></span>
    <span class="dd" style="left:12%;top:72%;width:66px;height:66px;--r:8deg"><svg viewBox="0 0 64 64"><use href="#d-suitcase"/></svg></span>
    <span class="dd" style="left:72%;top:74%;width:56px;height:56px;--r:-10deg"><svg viewBox="0 0 64 64"><use href="#d-compass"/></svg></span>
    <span class="dd" style="left:44%;top:86%;width:44px;height:44px;--r:4deg;--o:.16"><svg viewBox="0 0 64 64"><use href="#d-passport"/></svg></span>
    <div class="login-logo" id="loginLogo">${cfg ? logoLogin(cfg) : ''}</div>
    <span class="login-sep" aria-hidden="true"><svg viewBox="0 0 64 64"><use href="#d-plane"/></svg></span>
  </div>
  <div class="login-box">
    <span class="dd" style="left:84%;top:8%;width:52px;height:52px;--r:12deg;--o:.16"><svg viewBox="0 0 64 64"><use href="#d-globe"/></svg></span>
    <span class="dd" style="left:6%;top:86%;width:50px;height:50px;--r:-8deg;--o:.16"><svg viewBox="0 0 64 64"><use href="#d-ticket"/></svg></span>
    <form class="login-form" id="loginForm" novalidate>
      <p class="eyebrow">Acceso privado</p>
      <h1 id="lg-t">Ingresar al <em>panel</em></h1>
      <label class="f" for="lg-email">Email<input class="in" id="lg-email" type="email" autocomplete="username" required maxlength="160"></label>
      <label class="f" for="lg-pass">Contraseña
        <span class="pass-wrap"><input class="in" id="lg-pass" type="password" autocomplete="current-password" required maxlength="200" aria-describedby="rules"><button type="button" class="ver-clave" aria-controls="lg-pass">Mostrar</button></span>
      </label>
      ${reglas('rules')}
      <p class="login-err" id="lgErr" role="alert" hidden></p>
      <button class="btn pri" type="submit" style="padding:.8em">Ingresar al panel</button>
      <div class="sec-list"><span>Bloqueo temporal tras 5 intentos fallidos</span><span>La sesión se cierra sola después de 8 horas</span></div>
      <button type="button" class="linkish" id="olvide">¿Olvidaste tu contraseña?</button>
    </form>
    <form class="login-form" id="claveForm" novalidate hidden>
      <p class="eyebrow">Acceso privado</p>
      <h1>Creá tu <em>contraseña</em></h1>
      <p class="hint">Vas a usarla para entrar al panel. Guardala en un lugar seguro.</p>
      <label class="f" for="cl-pass">Contraseña nueva
        <span class="pass-wrap"><input class="in" id="cl-pass" type="password" autocomplete="new-password" required maxlength="200" aria-describedby="rules2"><button type="button" class="ver-clave" aria-controls="cl-pass">Mostrar</button></span>
      </label>
      ${reglas('rules2')}
      <label class="f" for="cl-pass2">Repetila<input class="in" id="cl-pass2" type="password" autocomplete="new-password" required maxlength="200"></label>
      <p class="login-err" id="clErr" role="alert" hidden></p>
      <button class="btn pri" type="submit" style="padding:.8em">Guardar y entrar</button>
    </form>
    <form class="login-form" id="recForm" novalidate hidden>
      <p class="eyebrow">Acceso privado</p>
      <h1>Recuperar <em>acceso</em></h1>
      <p class="hint">Escribí tu email y te mandamos un enlace para crear una contraseña nueva.</p>
      <label class="f" for="rc-email">Email<input class="in" id="rc-email" type="email" autocomplete="username" required maxlength="160"></label>
      <p class="login-err" id="rcErr" role="alert" hidden></p>
      <button class="btn pri" type="submit" style="padding:.8em">Enviar enlace</button>
      <button type="button" class="linkish" id="volverLogin">Volver a ingresar</button>
    </form>
  </div>
</section>

<div class="app" id="app" hidden>
  <aside class="side" id="side" aria-label="Menú del panel">
    <div class="mark" id="sideMark"></div>
    <nav id="sideNav">
      <button data-view="resumen" data-perm="">${ICONOS.resumen}Resumen</button>
      <div class="grp" data-perm="contenido">Contenido</div>
      <button data-view="paquetes" data-perm="contenido">${ICONOS.paquetes}Paquetes</button>
      <button data-view="ofertas" data-perm="contenido">${ICONOS.ofertas}Ofertas</button>
      <button data-view="resenas" data-perm="contenido">${ICONOS.resenas}Reseñas</button>
      <div class="grp" data-perm="consultas">Clientes</div>
      <button data-view="consultas" data-perm="consultas">${ICONOS.consultas}Consultas<span class="badge" id="newBadge" hidden>0</span></button>
      <div class="grp" data-perm="config">Agencia</div>
      <button data-view="config" data-perm="config">${ICONOS.config}Configuración</button>
      <button data-view="usuarios" data-perm="usuarios">${ICONOS.usuarios}Usuarios</button>
    </nav>
    <div class="side-foot">
      <div class="side-doodles" aria-hidden="true">
        <span class="dd" style="left:4%;top:12%;width:56px;height:56px;--r:-10deg"><svg viewBox="0 0 64 64"><use href="#d-plane"/></svg></span>
        <span class="dd" style="left:60%;top:0;width:48px;height:48px;--r:8deg;--o:.2"><svg viewBox="0 0 64 64"><use href="#d-map"/></svg></span>
        <span class="dd" style="left:30%;top:42%;width:64px;height:64px;--r:0deg;--o:.26"><svg viewBox="0 0 64 64"><use href="#d-loop"/></svg></span>
      </div>
      <a class="btn" id="siteLink" href="/" target="_blank" rel="noopener">Ver la web ↗</a>
      <div class="me" id="me"></div>
    </div>
  </aside>

  <div class="main">
    <header class="top">
      <button class="btn icon-btn menu-btn" id="menuBtn" aria-label="Abrir menú"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
      <div><p class="eyebrow" id="viewEyebrow">Panel</p><h1 id="viewTitle">Resumen</h1></div>
      <span class="sp"></span>
      <div class="tools">
        <button class="btn icon-btn" id="themeBtn" aria-label="Cambiar a modo oscuro" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></button>
        <button class="btn" id="logout">Salir</button>
      </div>
    </header>
    <div class="content" id="view"></div>
  </div>
</div>

<div class="cargando" id="cargando" role="status"><span></span>Cargando…</div>
<div class="scrim" id="scrim"></div>
<aside class="drawer" id="drawer" aria-labelledby="dr-t" aria-hidden="true"></aside>
<dialog id="bulk" aria-labelledby="bk-t"></dialog>
<dialog id="confirm" aria-labelledby="cf-t"></dialog>
<div class="tip" id="tip" role="tooltip"></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script src="/assets/panel.js?v=${VERSION}" defer></script>
</body>
</html>`.valor;
  return new Response(pagina, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
}
