(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const nf = new Intl.NumberFormat('es-AR');
const nf1 = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAY = 864e5;
const PLANE = '<svg viewBox="0 0 64 64" aria-hidden="true"><use href="#d-plane"/></svg>';
const GA_LOGO = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="16" y="3" width="5" height="18" rx="2.5" fill="#F9AB00"/><rect x="9.5" y="9" width="5" height="12" rx="2.5" fill="#E37400"/><circle cx="5.5" cy="18.5" r="2.5" fill="#E37400"/></svg>';
const SC_LOGO = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5" fill="none" stroke="#4285F4" stroke-width="2.4"/><path d="M15 15l5.5 5.5" stroke="#34A853" stroke-width="2.6" stroke-linecap="round"/><path d="M7 11.5l2-2.5 2 1.5 2.2-3" fill="none" stroke="#EA4335" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const DEFAULT_MARK = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="13" r="6.5" fill="#d62839"/><path d="M2 20c3.5 0 3.5-2.4 7-2.4s3.5 2.4 7 2.4 3.5-2.4 7-2.4 3.5 2.4 7 2.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M2 25.5c3.5 0 3.5-2.4 7-2.4s3.5 2.4 7 2.4 3.5-2.4 7-2.4 3.5 2.4 7 2.4" fill="none" stroke="currentColor" opacity=".55" stroke-width="2.2" stroke-linecap="round"/></svg>';
const TIPOS = ['Playa', 'Luna de miel', 'Familias', 'Aventura', 'Cultural', 'Grupal', 'Crucero', 'Escapada', 'Nieve', 'Europa'];
const EST = { publicado: ['ok', 'Publicado'], borrador: ['off', 'Borrador'], pausado: ['warn', 'Pausado'] };
const COLORES = { rojo: '#d62839', amarillo: '#e0a000', azul: '#1d3461', verde: '#1c7c47', negro: '#1c2230' };
const ORIGEN = { 'Córdoba': 'COR', 'Buenos Aires': 'EZE', 'Rosario': 'ROS', 'Mendoza': 'MDZ', 'Tucumán': 'TUC', 'Salta': 'SLA', 'Neuquén': 'NQN' };
const INCLUYE = ['Aéreo ida y vuelta', 'Traslados aeropuerto - hotel', 'Asistencia al viajero', 'Impuestos y tasas'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fdate = d => { const [y, m, dd] = d.split('-').map(Number); return `${dd} ${MONTHS[m - 1]} ${String(y).slice(2)}`; };
const rel = iso => { if (!iso) return 'nunca'; const m = Math.round((Date.now() - new Date(iso)) / 6e4); if (m < 1) return 'recién'; if (m < 60) return `hace ${m} min`; const h = Math.round(m / 60); if (h < 24) return `hace ${h} h`; const d = Math.round(h / 24); return d === 1 ? 'ayer' : d < 60 ? `hace ${d} días` : new Date(iso).toLocaleDateString('es-AR'); };
const localDT = iso => new Date(new Date(iso) - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
const hoy = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const parseNum = v => Number(String(v).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
const destinoDe = c => c.destino && c.destino !== 'Todavía no sé' ? c.destino : '';
const money = (v, cur = 'USD') => `${cur} ${nf.format(Math.round(v))}`;
const iata = p => (p.iata || (p.destino || 'XXX').normalize('NFD').replace(/[^A-Za-z]/g, '').slice(0, 3)).toUpperCase();
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 4200); };
const cargando = on => $('#cargando').classList.toggle('on', on);

/* ---------- conexión con el servidor ---------- */
async function api(metodo, url, cuerpo) {
  const op = { method: metodo, headers: {}, credentials: 'same-origin' };
  if (cuerpo instanceof FormData) op.body = cuerpo;
  else if (cuerpo !== undefined) { op.headers['Content-Type'] = 'application/json'; op.body = JSON.stringify(cuerpo); }
  let r;
  try { r = await fetch(url, op); } catch (e) { throw new Error('Sin conexión. Revisá internet y probá de nuevo.'); }
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && !url.includes('/ingresar')) { mostrarLogin(); throw new Error(j.error || 'Tu sesión venció. Volvé a ingresar.'); }
  if (!r.ok) throw new Error(j.error || 'Algo falló. Probá de nuevo.');
  return j;
}
/** Ejecuta una acción mostrando el estado en el botón y los errores en un aviso. */
async function accion(boton, fn) {
  const txt = boton && boton.textContent;
  if (boton) { if (boton.disabled) return; boton.disabled = true; boton.textContent = 'Guardando…'; }
  try { return await fn(); } catch (e) { toast(e.message); } finally { if (boton && boton.isConnected) { boton.disabled = false; boton.textContent = txt; } }
}

let S = null; // datos del panel
const puede = p => !!S && S.yo.permisos.includes(p);
const pk = id => S.paquetes.find(p => p.id === id);
const reemplazar = (lista, x) => { const i = lista.findIndex(y => y.id === x.id); if (i >= 0) lista[i] = x; else lista.unshift(x); };
async function cargarDatos() { S = await api('GET', '/api/panel/datos'); }
async function refrescarActividad() { try { const d = await api('GET', '/api/panel/datos'); S.actividad = d.actividad; } catch (e) { } }

/* ---------- marca ---------- */
function renderBrand() {
  const a = S.config.agencia, logo = S.config.logo;
  $('#sideMark').innerHTML = logo ? `<img src="${esc(logo)}" alt="${esc(a.nombre)}">` : `<span style="width:34px;height:34px;display:inline-block">${DEFAULT_MARK}</span><span class="name">${esc(a.nombre)}<small>Panel de gestión</small></span>`;
  $('#loginLogo').innerHTML = `<div class="slot">${logo ? `<img src="${esc(logo)}" alt="Logo de ${esc(a.nombre)}">` : DEFAULT_MARK}</div>${logo ? '' : `<h2>${esc(a.nombre)}</h2>`}<p>Panel de gestión de la web.</p>`;
  const b = $('#newBadge'), n = S.consultas.filter(c => c.estado === 'nueva').length; b.textContent = n; b.hidden = !n;
  $('#me').innerHTML = `<span class="av">${esc([...S.yo.nombre][0] || '?')}</span><div>${esc(S.yo.nombre)}<small>${esc(S.yo.rolNombre)}</small></div>`;
  $$('#sideNav [data-perm]').forEach(el => { el.hidden = !!el.dataset.perm && !puede(el.dataset.perm); });
}

/* ---------- tema: claro por defecto ---------- */
function setTheme(t) { document.documentElement.dataset.theme = t; const d = t === 'dark'; $('#themeBtn').setAttribute('aria-pressed', d); $('#themeBtn').setAttribute('aria-label', d ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'); try { localStorage.setItem('panel-tema', t); } catch (e) { } }
let savedTheme = 'light'; try { savedTheme = localStorage.getItem('panel-tema') || 'light'; } catch (e) { }
setTheme(savedTheme);
$('#themeBtn').onclick = () => { setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); if (current === 'resumen') VIEWS.resumen(); };

/* ---------- acceso ---------- */
const RULES = { len: v => v.length >= 8, up: v => /\p{Lu}/u.test(v), num: v => /\d/.test(v), sym: v => /[^\p{L}\d\s]/u.test(v) };
const passOk = v => Object.values(RULES).every(f => f(v));
const checkRules = (input, lista) => { const v = $(input).value; $$(lista + ' li').forEach(li => li.classList.toggle('ok', RULES[li.dataset.r](v))); };
$('#lg-pass').addEventListener('input', () => checkRules('#lg-pass', '#rules'));
$('#cl-pass').addEventListener('input', () => checkRules('#cl-pass', '#rules2'));
$$('.ver-clave').forEach(b => b.onclick = () => { const i = document.getElementById(b.getAttribute('aria-controls')), s = i.type === 'password'; i.type = s ? 'text' : 'password'; b.textContent = s ? 'Ocultar' : 'Mostrar'; });
const errorEn = (id, msg) => { const e = $(id); e.textContent = msg || ''; e.hidden = !msg; };
function formAcceso(cual) { ['#loginForm', '#claveForm', '#recForm'].forEach(f => $(f).hidden = f !== cual); setTimeout(() => $(cual + ' input')?.focus(), 50); }
function mostrarLogin() { closeDrawer(); $('#app').hidden = true; $('#login').hidden = false; formAcceso('#loginForm'); checkRules('#lg-pass', '#rules'); }

$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault(); errorEn('#lgErr');
  const email = $('#lg-email').value.trim(), clave = $('#lg-pass').value;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errorEn('#lgErr', 'Revisá el email, parece incompleto.'); $('#lg-email').focus(); return; }
  if (!passOk(clave)) { $('#lg-pass').classList.add('bad'); errorEn('#lgErr', 'La contraseña no cumple las reglas: mirá la lista de arriba.'); return; }
  $('#lg-pass').classList.remove('bad');
  const b = e.target.querySelector('[type=submit]'); b.disabled = true; b.textContent = 'Ingresando…';
  try { await api('POST', '/api/panel/ingresar', { email, clave }); $('#lg-pass').value = ''; await entrar(); }
  catch (err) { errorEn('#lgErr', err.message); }
  finally { b.disabled = false; b.textContent = 'Ingresar al panel'; }
});
let tokenClave = '';
$('#claveForm').addEventListener('submit', async e => {
  e.preventDefault(); errorEn('#clErr');
  const c1 = $('#cl-pass').value, c2 = $('#cl-pass2').value;
  if (!passOk(c1)) { errorEn('#clErr', 'La contraseña no cumple las reglas: mirá la lista de arriba.'); return; }
  if (c1 !== c2) { errorEn('#clErr', 'Las dos contraseñas no coinciden.'); $('#cl-pass2').focus(); return; }
  const b = e.target.querySelector('[type=submit]'); b.disabled = true;
  try { await api('POST', '/api/panel/clave', { token: tokenClave, clave: c1 }); tokenClave = ''; e.target.reset(); await entrar(); toast('Listo, tu contraseña quedó guardada.'); }
  catch (err) { errorEn('#clErr', err.message); }
  finally { b.disabled = false; }
});
$('#olvide').onclick = () => { $('#rc-email').value = $('#lg-email').value; errorEn('#rcErr'); formAcceso('#recForm'); };
$('#volverLogin').onclick = () => formAcceso('#loginForm');
$('#recForm').addEventListener('submit', async e => {
  e.preventDefault(); errorEn('#rcErr');
  const b = e.target.querySelector('[type=submit]'); b.disabled = true;
  try { const j = await api('POST', '/api/panel/recuperar', { email: $('#rc-email').value.trim() }); toast(j.mensaje); formAcceso('#loginForm'); }
  catch (err) { errorEn('#rcErr', err.message); }
  finally { b.disabled = false; }
});

async function entrar() {
  cargando(true);
  try { await cargarDatos(); } catch (e) { cargando(false); if ($('#app').hidden) mostrarLogin(); toast(e.message); return; }
  cargando(false);
  $('#login').hidden = true; $('#app').hidden = false; renderBrand();
  go(location.hash.slice(1) || 'resumen');
}
$('#logout').onclick = async () => { try { await api('POST', '/api/panel/salir', {}); } catch (e) { } S = null; $('#view').innerHTML = ''; history.replaceState(null, '', '/panel'); mostrarLogin(); };

/* ---------- navegación ---------- */
const TITLES = { resumen: ['Panel', 'Resumen <em>del día</em>', ''], paquetes: ['Contenido', 'Tus <em>paquetes</em>', 'contenido'], ofertas: ['Contenido', 'Tus <em>ofertas</em>', 'contenido'], resenas: ['Contenido', 'Reseñas <em>de Google</em>', 'contenido'], consultas: ['Clientes', 'Consultas <em>de viajeros</em>', 'consultas'], config: ['Agencia', 'Configuración', 'config'], usuarios: ['Agencia', 'Usuarios', 'usuarios'] };
let current = 'resumen';
function go(v) {
  if (!TITLES[v] || (TITLES[v][2] && !puede(TITLES[v][2]))) v = 'resumen';
  current = v;
  $$('#sideNav button').forEach(b => b.dataset.view === v ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  $('#viewEyebrow').textContent = TITLES[v][0]; $('#viewTitle').innerHTML = TITLES[v][1]; $('#side').classList.remove('open');
  hideTip(); VIEWS[v](); renderBrand();
  try { history.replaceState(null, '', '#' + v); } catch (e) { }
}
$('#sideNav').addEventListener('click', e => { const b = e.target.closest('button[data-view]'); if (b) go(b.dataset.view); });
$('#menuBtn').onclick = () => $('#side').classList.add('open');
document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('#side').classList.remove('open'); closeDrawer(); } });
const V = h => { $('#view').innerHTML = h; };
const VIEWS = {};
// fotos rotas: se quitan sin romper el diseño (sin manejadores en línea, por la política de seguridad)
document.addEventListener('error', e => { if (e.target.tagName === 'IMG' && e.target.closest('.thumb')) e.target.remove(); }, true);

/* ---------- tooltip compartido ---------- */
const tip = $('#tip');
function showTip(x, y, html) { tip.innerHTML = html; tip.classList.add('on'); const r = tip.getBoundingClientRect(); let l = x + 14, t = y - r.height - 12; if (l + r.width > innerWidth - 8) l = x - r.width - 14; if (t < 8) t = y + 16; tip.style.left = l + 'px'; tip.style.top = t + 'px'; }
const hideTip = () => tip.classList.remove('on');

/* ---------- métricas de Google ---------- */
let range = 28, metricasCache = {};
function sparkSVG(vals) {
  if (!vals || vals.length < 2) return '';
  const w = 200, h = 34, max = Math.max(...vals), min = Math.min(...vals);
  const pts = vals.map((v, i) => [i / (vals.length - 1) * w, h - 4 - (v - min) / (max - min || 1) * (h - 10)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const [lx, ly] = pts[pts.length - 1];
  return `<div class="spark" aria-hidden="true"><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="var(--mark-muted)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg><i style="left:${(lx / w * 100).toFixed(1)}%;top:${(ly / h * 100).toFixed(1)}%"></i></div>`;
}
const muestra = a => { const step = Math.max(1, Math.floor(a.length / 12)); return a.filter((_, i) => (a.length - 1 - i) % step === 0).slice(-12); };
function tile(label, source, value, now, prev, fmt, higherIsBetter, spark) {
  const ch = prev ? (now - prev) / prev * 100 : 0, up = ch >= 0, good = up === higherIsBetter;
  return `<div class="card tile"><div class="lab"><span>${label}</span><span class="srcic" title="${source}">${source === 'Analytics' ? GA_LOGO : SC_LOGO}<span class="sr-only">${source}</span></span></div><div class="val">${fmt(value)}</div>${prev ? `<div class="delta ${good ? 'good' : 'badd'}">${up ? '▲' : '▼'} ${nf1.format(Math.abs(ch))} % <span>vs. ${range} días anteriores</span></div>` : '<div class="delta"><span>Sin datos del período anterior</span></div>'}${sparkSVG(spark)}</div>`;
}
const tileVacio = (label, source, motivo) => `<div class="card tile vacio"><div class="lab"><span>${label}</span><span class="srcic">${source === 'Analytics' ? GA_LOGO : SC_LOGO}</span></div><div class="val muted">—</div><div class="delta"><span>${esc(motivo)}</span></div></div>`;
function niceMax(v) { if (v <= 0) return 10; const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
function lineChart(box, data) {
  if (!data.length) { box.innerHTML = '<p class="empty">Todavía no hay datos para este período.</p>'; return; }
  const W = Math.max(280, box.clientWidth - 32), H = 230, L = 44, R = 46, T = 14, B = 26;
  const max = niceMax(Math.max(...data.map(d => d.v)) * 1.1), n = data.length;
  const x = i => L + (n === 1 ? .5 : i / (n - 1)) * (W - L - R), y = v => T + (1 - v / max) * (H - T - B);
  const ticks = [0, .25, .5, .75, 1].map(f => Math.round(max * f));
  const line = data.map((d, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(d.v).toFixed(1)).join(' ');
  const area = line + ` L${x(n - 1).toFixed(1)} ${y(0)} L${x(0)} ${y(0)} Z`;
  const lblEvery = Math.ceil(n / Math.max(2, Math.min(6, Math.floor((W - L - R) / 80))));
  const xl = data.map((d, i) => (i % lblEvery === 0 || i === n - 1) && (n - 1 - i >= lblEvery / 2 || i === n - 1) ? `<text x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="middle">${d.d.getDate()} ${MONTHS[d.d.getMonth()]}</text>` : '').join('');
  const last = data[n - 1];
  box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" height="${H}" role="img" aria-label="Visitantes por día en los últimos ${n} días">
    <g class="grid">${ticks.map(t => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L - 8}" y="${y(t) + 4}" text-anchor="end">${nf.format(t)}</text>`).join('')}</g>
    <path d="${area}" fill="var(--chart-wash)"/>
    <path d="${line}" fill="none" stroke="var(--chart)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <line class="base" x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}"/>${xl}
    <circle cx="${x(n - 1)}" cy="${y(last.v)}" r="4" fill="var(--chart)" stroke="var(--surface-ring)" stroke-width="2"/>
    <text class="endlabel" x="${x(n - 1) + 8}" y="${y(last.v) + 4}">${nf.format(last.v)}</text>
    <line class="hair" id="hair" y1="${T}" y2="${y(0)}"/><circle class="hot" id="hot" r="5" fill="var(--chart)" stroke="var(--surface-ring)" stroke-width="2"/>
    <rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" fill="transparent" id="hit" tabindex="0" aria-label="Recorrer los días con el mouse o las flechas"/></svg>`;
  const svg = box.querySelector('svg'), hit = $('#hit', box), hair = $('#hair', box), hot = $('#hot', box);
  let idx = n - 1;
  const show = (i, cx, cy) => {
    idx = Math.max(0, Math.min(n - 1, i)); const d = data[idx];
    hair.setAttribute('x1', x(idx)); hair.setAttribute('x2', x(idx)); hot.setAttribute('cx', x(idx)); hot.setAttribute('cy', y(d.v)); box.classList.add('hover');
    const b = svg.getBoundingClientRect(), k = b.width / W;
    showTip(cx ?? b.left + x(idx) * k, cy ?? b.top + y(d.v) * k, `<b>${nf.format(d.v)}</b><span class="k">Visitantes · ${d.d.getDate()} ${MONTHS[d.d.getMonth()]}</span>`);
  };
  hit.addEventListener('pointermove', e => { const b = svg.getBoundingClientRect(), px = (e.clientX - b.left) * W / b.width; show(Math.round((px - L) / (W - L - R) * (n - 1)), e.clientX, e.clientY); });
  hit.addEventListener('pointerleave', () => { box.classList.remove('hover'); hideTip(); });
  hit.addEventListener('focus', () => show(idx));
  hit.addEventListener('blur', () => { box.classList.remove('hover'); hideTip(); });
  hit.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); } if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); } });
}
const aFecha = s => new Date(s + 'T12:00:00');

function bloqueMetricas(m) {
  if (!m) return `<div class="tiles">${['Visitantes', 'Clics desde Google', 'Apariciones en Google', 'Posición promedio'].map(l => `<div class="card tile cargando-tile"><div class="lab"><span>${l}</span></div><div class="val muted">…</div></div>`).join('')}</div>`;
  const ga = m.ga, sc = m.sc;
  if (!ga.conectado && !sc.conectado) {
    return `<div class="card conectar"><div class="card-h"><div><h2>Conectá Google para ver tus visitas</h2><span class="sub">Analytics muestra cuánta gente entra a la web; Search Console, qué buscaron en Google para encontrarte.</span></div></div>
    <div class="card-b"><p class="muted" style="margin:0">${esc(ga.motivo || sc.motivo || '')}</p>${puede('config') ? '<div class="row" style="margin-top:12px"><button class="btn pri" data-go="config">Ir a Configuración</button></div>' : ''}</div></div>`;
  }
  const serie = ga.conectado ? ga.serie.map(x => ({ d: aFecha(x.d), v: x.v })) : [];
  const scS = sc.conectado ? sc.serie : [];
  const maxPage = ga.conectado && ga.paginas.length ? Math.max(...ga.paginas.map(p => p.v)) : 1, maxQ = sc.conectado && sc.consultas.length ? Math.max(...sc.consultas.map(q => q.c), 1) : 1;
  return `<div class="tiles">
    ${ga.conectado ? tile('Visitantes', 'Analytics', ga.usuarios, ga.usuarios, ga.usuariosPrev, v => nf.format(v), true, muestra(serie.map(x => x.v))) : tileVacio('Visitantes', 'Analytics', ga.motivo)}
    ${sc.conectado ? tile('Clics desde Google', 'Search Console', sc.clics, sc.clics, sc.clicsPrev, v => nf.format(v), true, muestra(scS.map(x => x.clics))) : tileVacio('Clics desde Google', 'Search Console', sc.motivo)}
    ${sc.conectado ? tile('Apariciones en Google', 'Search Console', sc.impresiones, sc.impresiones, sc.impresionesPrev, v => v >= 1e4 ? nf1.format(v / 1000) + ' mil' : nf.format(v), true, muestra(scS.map(x => x.impresiones))) : tileVacio('Apariciones en Google', 'Search Console', sc.motivo)}
    ${sc.conectado ? tile('Posición promedio', 'Search Console', sc.posicion, sc.posicion, sc.posicionPrev, v => v ? nf1.format(v) : '—', false, muestra(scS.map(x => -x.posicion))) : tileVacio('Posición promedio', 'Search Console', sc.motivo)}
  </div>
  ${ga.conectado ? `<div class="charts">
    <div class="card"><div class="card-h"><div><h2>Visitantes por día</h2><span class="sub">Google Analytics · últimos ${range} días</span></div></div>
      <div class="chart" id="visits"></div>
      <details class="datatbl"><summary>Ver los datos en tabla</summary><div class="tbl-wrap"><table><thead><tr><th>Día</th><th class="r">Visitantes</th></tr></thead><tbody>${serie.slice().reverse().map(d => `<tr><td>${d.d.getDate()} ${MONTHS[d.d.getMonth()]}</td><td class="r">${nf.format(d.v)}</td></tr>`).join('')}</tbody></table></div></details>
    </div>
    <div class="card"><div class="card-h"><div><h2>Páginas más vistas</h2><span class="sub">Google Analytics · vistas</span></div></div>
      <ul class="bars">${ga.paginas.map(p => `<li tabindex="0" data-tip="<b>${nf.format(p.v)} vistas</b><span class='k'>${esc(esc(p.u))}</span>"><div class="top-row"><span>${esc(p.n.split(' · ')[0] || p.u)}</span><span class="num">${nf.format(p.v)}</span></div><div class="track"><div class="bar" style="width:${(p.v / maxPage * 100).toFixed(1)}%"></div></div></li>`).join('') || '<li class="empty">Sin datos todavía.</li>'}</ul>
    </div>
  </div>` : ''}
  ${sc.conectado ? `<div class="card"><div class="card-h"><div><h2>Búsquedas que traen gente</h2><span class="sub">Search Console · lo que escribieron en Google antes de entrar</span></div></div>
    <div class="tbl-wrap"><table><thead><tr><th>Búsqueda</th><th>Clics</th><th class="r">Apariciones</th><th class="r">% de clics</th><th class="r">Posición</th></tr></thead><tbody>
    ${sc.consultas.map(q => `<tr><td>${esc(q.q)}</td><td class="num" style="white-space:nowrap"><span class="qbar" style="width:${(q.c / maxQ * 90).toFixed(0)}px"></span>${nf.format(q.c)}</td><td class="r">${nf.format(q.i)}</td><td class="r">${q.i ? nf1.format(q.c / q.i * 100) : '0,0'} %</td><td class="r">${nf1.format(q.p)}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">Todavía no hay búsquedas registradas.</td></tr>'}
    </tbody></table></div></div>` : ''}`;
}
async function traerMetricas() {
  if (!puede('metricas')) return;
  const dias = range;
  if (!metricasCache[dias]) {
    try { metricasCache[dias] = await api('GET', '/api/panel/metricas?dias=' + dias); }
    catch (e) { metricasCache[dias] = { ga: { conectado: false, motivo: e.message }, sc: { conectado: false, motivo: e.message } }; }
  }
  if (current !== 'resumen' || dias !== range) return;
  const box = $('#metricas'); if (!box) return;
  box.innerHTML = bloqueMetricas(metricasCache[dias]);
  const vis = $('#visits'); if (vis && metricasCache[dias].ga.conectado) lineChart(vis, metricasCache[dias].ga.serie.map(x => ({ d: aFecha(x.d), v: x.v })));
}
VIEWS.resumen = () => {
  const nuevas = S.consultas.filter(c => c.estado === 'nueva').length;
  const m = metricasCache[range];
  V(`
  ${puede('metricas') ? `<div class="filters">
    <div class="seg" role="group" aria-label="Período">${[7, 28, 90].map(d => `<button type="button" data-range="${d}" aria-pressed="${range === d}"><span class="lg">Últimos </span>${d} días</button>`).join('')}</div>
    <span class="src">${GA_LOGO}<span class="dot${m && m.ga.conectado ? '' : ' off'}"></span><b>Google Analytics</b>${m ? (m.ga.conectado ? 'conectado' : 'sin conectar') : '…'}</span>
    <span class="src">${SC_LOGO}<span class="dot${m && m.sc.conectado ? '' : ' off'}"></span><b>Search Console</b>${m ? (m.sc.conectado ? 'conectado' : 'sin conectar') : '…'}</span>
  </div>
  <div id="metricas" style="display:grid;gap:22px">${bloqueMetricas(m)}</div>` : ''}
  <div class="dash">
    ${puede('consultas') ? `<div class="card"><div class="card-h"><h2>Consultas recientes ${nuevas ? `<span class="pill info">${nuevas} nueva${nuevas === 1 ? '' : 's'}</span>` : ''}</h2><button class="btn sm" data-go="consultas">Ver todas</button></div>
      <ul class="list">${S.consultas.slice(0, 5).map(c => `<li class="clic" data-abrir-consulta="${esc(c.id)}">${c.estado === 'nueva' ? '<span class="dot-new" aria-label="Nueva"></span>' : '<span style="width:9px;flex:none"></span>'}<div class="grow"><div class="t">${esc(c.nombre)}${destinoDe(c) ? ' · ' + esc(destinoDe(c)) : ''}</div><div class="s">${esc(c.mensaje || c.telefono)}</div></div><span class="s">${rel(c.creado)}</span></li>`).join('') || '<li class="empty">Todavía no llegaron consultas desde la web.</li>'}</ul></div>` : ''}
    <div style="display:grid;gap:22px;align-content:start">
      ${puede('contenido') ? `<div class="card"><div class="card-h"><h2>Accesos rápidos</h2></div><div class="card-b row">
        <button class="btn pri" data-act="new-pk">+ Nuevo paquete</button><button class="btn" data-act="new-of">+ Nueva oferta</button><button class="btn" data-act="bulk">Actualizar precios</button></div></div>` : ''}
      <div class="card"><div class="card-h"><h2>Actividad del equipo</h2></div><ul class="list log">${S.actividad.slice(0, 8).map(l => `<li><div class="grow"><b>${esc(l.nombre)}</b> ${esc(l.accion)}</div><span class="when">${rel(l.creado)}</span></li>`).join('') || '<li class="empty">Sin actividad todavía.</li>'}</ul></div>
    </div>
  </div>`);
  if (m) { const vis = $('#visits'); if (vis && m.ga.conectado) lineChart(vis, m.ga.serie.map(x => ({ d: aFecha(x.d), v: x.v }))); }
  else traerMetricas().then(() => { if (current === 'resumen' && metricasCache[range]) VIEWS.resumen(); });
};
$('#view').addEventListener('click', e => {
  const b = e.target.closest('[data-range]'); if (b) { range = +b.dataset.range; VIEWS.resumen(); }
  const c = e.target.closest('[data-abrir-consulta]'); if (c) { cSel = c.dataset.abrirConsulta; cFil = 'todas'; go('consultas'); }
});
$('#view').addEventListener('pointermove', e => { const li = e.target.closest('[data-tip]'); if (li) showTip(e.clientX, e.clientY, li.dataset.tip); });
$('#view').addEventListener('pointerout', e => { const li = e.target.closest('[data-tip]'); if (li && !li.contains(e.relatedTarget)) hideTip(); });
$('#view').addEventListener('focusin', e => { const li = e.target.closest('[data-tip]'); if (li) { const b = li.getBoundingClientRect(); showTip(b.right - 60, b.top, li.dataset.tip); } });
$('#view').addEventListener('focusout', e => { if (e.target.closest('[data-tip]')) hideTip(); });
let rsz; addEventListener('resize', () => { clearTimeout(rsz); rsz = setTimeout(() => { const m = metricasCache[range]; if (current === 'resumen' && $('#visits') && m && m.ga.conectado) lineChart($('#visits'), m.ga.serie.map(x => ({ d: aFecha(x.d), v: x.v }))); }, 150); });

/* ---------- paquetes ---------- */
let pkQ = '', pkEst = 'todos', pkReg = 'todas', sel = new Set();
VIEWS.paquetes = () => {
  V(`<div class="card">
    <div class="toolbar">
      <label class="sr-only" for="pk-q">Buscar paquete</label><input class="in search" id="pk-q" placeholder="Buscar por nombre o destino…" value="${esc(pkQ)}">
      <label class="sr-only" for="pk-reg">Región</label><select class="in" id="pk-reg"><option value="todas">Todas las regiones</option>${Object.entries(S.regiones).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
      <label class="sr-only" for="pk-est">Estado</label><select class="in" id="pk-est"><option value="todos">Todos los estados</option><option value="publicado">Publicados</option><option value="borrador">Borradores</option><option value="pausado">Pausados</option></select>
      <button class="btn" data-act="bulk">Actualizar precios en bloque</button>
      <button class="btn pri" data-act="new-pk">+ Nuevo paquete</button>
    </div>
    <div class="tbl-wrap"><table><thead><tr><th><input type="checkbox" id="selAll" aria-label="Seleccionar todos"></th><th>Paquete</th><th>Tipo</th><th>Noches</th><th>Precio base</th><th>Estado</th><th>Portada</th><th></th></tr></thead><tbody id="pkRows"></tbody></table></div>
  </div>
  <p class="muted" style="font-size:.9rem;margin:0">Tip: cambiá el precio directo en la tabla y apretá Enter. Para todo lo demás (fotos, itinerario, qué incluye, precios por habitación) usá Editar. Los cambios se ven en la web en menos de un minuto.</p>`);
  $('#pk-est').value = pkEst; $('#pk-reg').value = pkReg;
  $('#pk-q').oninput = e => { pkQ = e.target.value; rows(); };
  $('#pk-est').onchange = e => { pkEst = e.target.value; rows(); };
  $('#pk-reg').onchange = e => { pkReg = e.target.value; rows(); };
  $('#selAll').onchange = e => { filtered().forEach(p => e.target.checked ? sel.add(p.id) : sel.delete(p.id)); rows(); };
  rows();
};
const filtered = () => S.paquetes.filter(p => (pkEst === 'todos' || p.estado === pkEst) && (pkReg === 'todas' || p.region === pkReg) && (!pkQ || (p.nombre + ' ' + p.destino + ' ' + p.pais).toLowerCase().includes(pkQ.toLowerCase())));
function rows() {
  const list = filtered(); if (!$('#pkRows')) return;
  $('#pkRows').innerHTML = list.map(p => `<tr data-id="${esc(p.id)}">
    <td><input type="checkbox" class="sel" ${sel.has(p.id) ? 'checked' : ''} aria-label="Seleccionar ${esc(p.nombre)}"></td>
    <td><div class="pk-name"><span class="thumb">${p.fotos[0] ? `<img src="${esc(p.fotos[0])}" alt="" loading="lazy">` : ''}</span><div><b>${esc(p.nombre)}${p.etiqueta ? `<span class="lbl" style="background:${COLORES[p.etiquetaColor] || COLORES.rojo}">${esc(p.etiqueta)}</span>` : ''}</b><small>${esc(S.regiones[p.region] || p.region)} · ${esc(p.transporte)} desde ${esc(p.salidaDesde)} · ${p.salidas.length} salida${p.salidas.length === 1 ? '' : 's'}${p.estado === 'publicado' ? ` · <a href="/paquetes/${esc(p.slug)}" target="_blank" rel="noopener">ver ↗</a>` : ''}</small></div></div></td>
    <td>${esc(p.tipo)}</td>
    <td class="num">${p.noches}</td>
    <td><label class="price-in"><span>${p.moneda}</span><input type="text" inputmode="numeric" value="${nf.format(p.precio)}" aria-label="Precio de ${esc(p.nombre)}" data-price></label><div class="ars">${p.moneda === 'USD' && S.config.cotizacion ? `≈ ARS ${nf.format(p.precio * S.config.cotizacion)}` : p.moneda === 'ARS' ? 'en pesos' : ''}</div></td>
    <td><span class="pill ${EST[p.estado][0]}">${EST[p.estado][1]}</span></td>
    <td><button class="star" data-star aria-pressed="${p.destacado}" aria-label="Destacar en portada">★</button></td>
    <td><div class="row" style="flex-wrap:nowrap"><button class="btn sm" data-edit>Editar</button><button class="btn sm" data-dup>Duplicar</button></div></td>
  </tr>`).join('') || `<tr><td colspan="8" class="empty">${S.paquetes.length ? 'No hay paquetes que coincidan con la búsqueda.' : 'Todavía no cargaste paquetes. Empezá con “+ Nuevo paquete”.'}</td></tr>`;
}
$('#view').addEventListener('change', async e => {
  const t = e.target;
  if (t.matches('[data-price]')) {
    const id = t.closest('tr').dataset.id, p = pk(id), v = Math.round(parseNum(t.value));
    if (!v || v < 1) { toast('Escribí un precio mayor a 0.'); t.value = nf.format(p.precio); return; }
    t.value = nf.format(v);
    if (v === p.precio) return;
    const box = t.closest('.price-in');
    try {
      const j = await api('PATCH', `/api/panel/paquetes/${id}`, { precio: v });
      reemplazar(S.paquetes, j.paquete); toast(`Precio guardado. ${p.nombre}: ${money(v, p.moneda)}.`);
      box.classList.add('saved'); if (p.moneda === 'USD' && S.config.cotizacion) box.nextElementSibling.textContent = `≈ ARS ${nf.format(v * S.config.cotizacion)}`; setTimeout(() => box.classList.remove('saved'), 1400);
      refrescarActividad();
    } catch (err) { toast(err.message); t.value = nf.format(p.precio); }
  }
  if (t.matches('.sel')) { const id = t.closest('tr').dataset.id; t.checked ? sel.add(id) : sel.delete(id); }
});
$('#view').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-price]')) e.target.blur(); });
$('#view').addEventListener('click', async e => {
  const t = e.target, tr = t.closest('tr[data-id]'), p = tr && S.paquetes.find(x => x.id === tr.dataset.id);
  const g = t.closest('[data-go]'); if (g) go(g.dataset.go);
  const act = t.closest('[data-act]'); if (act) { const a = act.dataset.act; if (a === 'new-pk') editPk(null); if (a === 'bulk') bulk(); if (a === 'new-of') editOffer(null); }
  if (p && t.closest('[data-star]')) {
    await accion(null, async () => { const j = await api('PATCH', `/api/panel/paquetes/${p.id}`, { destacado: !p.destacado }); reemplazar(S.paquetes, j.paquete); toast(j.paquete.destacado ? 'Ahora aparece destacado.' : 'Ya no aparece destacado.'); rows(); refrescarActividad(); });
  }
  if (p && t.closest('[data-edit]')) editPk(p);
  if (p && t.closest('[data-dup]')) {
    await accion(t.closest('[data-dup]'), async () => { const j = await api('POST', `/api/panel/paquetes/${p.id}/duplicar`, {}); S.paquetes.push(j.paquete); toast('Paquete duplicado como borrador.'); rows(); refrescarActividad(); });
  }
});

/* ---------- editor lateral ---------- */
const dr = $('#drawer'), scrim = $('#scrim');
function openDrawer(html) { dr.innerHTML = html; dr.classList.add('on'); scrim.classList.add('on'); dr.setAttribute('aria-hidden', 'false'); setTimeout(() => dr.querySelector('input,select,textarea')?.focus(), 350); dr.querySelectorAll('[data-close]').forEach(b => b.onclick = closeDrawer); const tabs = dr.querySelector('.tabs'); if (tabs) tabs.onclick = e => { const b = e.target.closest('[data-tab]'); if (!b) return; $$('[data-tab]', dr).forEach(x => x.setAttribute('aria-selected', x === b)); $$('[data-pane]', dr).forEach(p => p.hidden = p.dataset.pane !== b.dataset.tab); }; }
function closeDrawer() { dr.classList.remove('on'); scrim.classList.remove('on'); dr.setAttribute('aria-hidden', 'true'); }
scrim.onclick = closeDrawer;
const tabTo = id => $(`[data-tab="${id}"]`, dr).click();
function chipList(el, arr, cls = '') { el.className = 'chips ' + cls; el.innerHTML = arr.map((x, i) => `<span>${esc(x)}<button type="button" data-rm="${i}" aria-label="Quitar ${esc(x)}">✕</button></span>`).join('') || '<small class="muted">Vacío.</small>'; }

/* Achica la foto en el navegador antes de subirla (Vercel acepta hasta 4,5 MB por pedido). */
async function achicar(file, maxLado, tipo) {
  if (file.type === 'image/svg+xml') return file;
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { return file; }
  const k = Math.min(1, maxLado / Math.max(bmp.width, bmp.height));
  if (k === 1 && file.size < 3.5 * 1024 * 1024 && tipo !== 'image/jpeg') { bmp.close?.(); return file; }
  const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
  const c = cv.getContext('2d'); if (tipo === 'image/jpeg') { c.fillStyle = '#fff'; c.fillRect(0, 0, cv.width, cv.height); }
  c.drawImage(bmp, 0, 0, cv.width, cv.height); bmp.close?.();
  const blob = await new Promise(r => cv.toBlob(r, tipo, .9));
  return blob && blob.size < file.size ? blob : (file.size < 4.3 * 1024 * 1024 ? file : blob || file);
}
async function subirImagen(file, tipo) {
  if (!/^image\/(jpeg|png|webp|heic|heif|svg\+xml)$/.test(file.type)) throw new Error(`"${file.name}" no es JPG, PNG ni WebP.`);
  if (file.size > 25 * 1024 * 1024) throw new Error(`"${file.name}" pesa más de 25 MB.`);
  const chico = tipo === 'foto' ? await achicar(file, 2400, 'image/jpeg') : await achicar(file, 1200, 'image/png');
  if (chico.size > 4.3 * 1024 * 1024) throw new Error(`"${file.name}" sigue pesando demasiado. Probá con otra versión.`);
  const fd = new FormData(); fd.append('archivo', chico, file.name.replace(/\.\w+$/, '') + (tipo === 'foto' ? '.jpg' : '.png')); fd.append('tipo', tipo);
  const j = await api('POST', '/api/panel/subir', fd);
  return j.url;
}

function editPk(p) {
  const isNew = !p;
  const d = p ? structuredClone(p) : { nombre: '', slug: '', destino: '', pais: '', iata: '', region: Object.keys(S.regiones)[0], tipo: 'Playa', etiqueta: '', etiquetaColor: 'rojo', resumen: '', descripcion: '', estado: 'borrador', destacado: false, moneda: 'USD', precio: 0, precioSingle: 0, precioTriple: 0, precioMenor: 0, cuotas: 0, sena: 0, noches: 7, cupos: 10, regimen: 'All inclusive', transporte: 'Aéreo', salidaDesde: S.config.agencia.ciudad === 'Villa Carlos Paz' ? 'Córdoba' : (S.config.agencia.provincia || 'Córdoba'), salidas: [], hotel: '', estrellas: 0, itinerario: [], incluye: INCLUYE.slice(), noIncluye: [], fotos: [], coord: '', seoTitulo: '', seoDescripcion: '' };
  const opt = (arr, v) => arr.map(x => `<option ${x === v ? 'selected' : ''}>${x}</option>`).join('');
  const dominio = location.host;
  openDrawer(`
  <div class="drawer-h"><h2 id="dr-t">${isNew ? 'Nuevo paquete' : 'Editar paquete'}</h2><button class="btn icon-btn" data-close aria-label="Cerrar">✕</button></div>
  <div class="tabs" role="tablist">${[['t1', 'General'], ['t2', 'Precios'], ['t3', 'Salidas y hotel'], ['t4', 'Itinerario'], ['t5', 'Qué incluye'], ['t6', 'Fotos'], ['t7', 'Google']].map(([k, v], i) => `<button role="tab" aria-selected="${!i}" data-tab="${k}">${v}</button>`).join('')}</div>
  <form class="drawer-b" id="pkForm" novalidate>
    <div class="pane" data-pane="t1">
      <label class="f" for="e-nombre">Nombre del paquete<input class="in" id="e-nombre" value="${esc(d.nombre)}" maxlength="80" placeholder="Ej.: Punta Cana all inclusive"></label>
      <div class="g3"><label class="f" for="e-destino">Destino<input class="in" id="e-destino" value="${esc(d.destino)}" maxlength="60"></label><label class="f" for="e-pais">País o zona<input class="in" id="e-pais" value="${esc(d.pais)}" maxlength="60"></label><label class="f" for="e-iata">Código del aeropuerto <small class="muted">(para la estampilla)</small><input class="in" id="e-iata" value="${esc(d.iata)}" maxlength="3" style="text-transform:uppercase" placeholder="${esc(iata(d))}"></label></div>
      <div class="g2"><label class="f" for="e-region">Región (filtro de la web)<select class="in" id="e-region">${Object.entries(S.regiones).map(([k, v]) => `<option value="${k}" ${d.region === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="f" for="e-tipo">Tipo de viaje<input class="in" id="e-tipo" value="${esc(d.tipo)}" list="tipos" maxlength="40"><datalist id="tipos">${TIPOS.map(t => `<option>${t}</option>`).join('')}</datalist></label></div>
      <div class="g2"><label class="f" for="e-etq">Etiqueta en la tarjeta <small class="muted">(opcional)</small><input class="in" id="e-etq" value="${esc(d.etiqueta)}" maxlength="24" list="etqs" placeholder="Oferta, Luna de miel…"><datalist id="etqs"><option>Oferta</option><option>Más vendido</option><option>Luna de miel</option><option>Últimos lugares</option><option>Ideal familias</option><option>Nuevo</option></datalist></label>
      <div class="f" style="display:grid;gap:6px;font-size:.9rem;font-weight:700">Color de la etiqueta<div class="swatches">${Object.entries(COLORES).map(([k, c]) => `<label style="background:${c}" title="${k}"><input type="radio" name="etqc" value="${k}" ${d.etiquetaColor === k ? 'checked' : ''} aria-label="${k}"></label>`).join('')}</div></div></div>
      <label class="f" for="e-resumen">Resumen para la tarjeta<textarea class="in" id="e-resumen" maxlength="200">${esc(d.resumen)}</textarea><span class="count-hint" data-count="e-resumen" data-max="140"></span></label>
      <label class="f" for="e-desc">Descripción completa <small class="muted">(página del paquete; dejá una línea en blanco entre párrafos)</small><textarea class="in" id="e-desc" style="min-height:130px" maxlength="6000">${esc(d.descripcion)}</textarea></label>
      <fieldset style="border:0;padding:0;margin:0;display:grid;gap:8px"><legend style="font-size:.9rem;font-weight:700;margin-bottom:6px">Estado en la web</legend>
        <div class="radio-row">${Object.entries(EST).map(([k, [, v]]) => `<label><input type="radio" name="estado" value="${k}" ${d.estado === k ? 'checked' : ''}>${v}</label>`).join('')}</div></fieldset>
      <label class="switch"><input type="checkbox" id="e-dest" ${d.destacado ? 'checked' : ''}><i></i>Destacar en la portada</label>
    </div>
    <div class="pane" data-pane="t2" hidden>
      <div class="g3"><label class="f" for="e-moneda">Moneda<select class="in" id="e-moneda">${opt(['USD', 'ARS'], d.moneda)}</select></label><label class="f" for="e-precio">Precio por persona, base doble<input class="in num" id="e-precio" inputmode="numeric" value="${d.precio ? nf.format(d.precio) : ''}"></label><label class="f" for="e-noches">Noches<input class="in num" id="e-noches" type="number" min="0" max="365" value="${d.noches}"></label></div>
      <p class="help" id="e-ars"></p>
      <div class="g3"><label class="f" for="e-single">Base single <small class="muted">(opcional)</small><input class="in num" id="e-single" inputmode="numeric" value="${d.precioSingle ? nf.format(d.precioSingle) : ''}"></label><label class="f" for="e-triple">Base triple <small class="muted">(opcional)</small><input class="in num" id="e-triple" inputmode="numeric" value="${d.precioTriple ? nf.format(d.precioTriple) : ''}"></label><label class="f" for="e-menor">Menor <small class="muted">(opcional)</small><input class="in num" id="e-menor" inputmode="numeric" value="${d.precioMenor ? nf.format(d.precioMenor) : ''}"></label></div>
      <div class="g3"><label class="f" for="e-cuotas">Cuotas sin interés<select class="in" id="e-cuotas">${[0, 3, 6, 9, 12, 18, 24].map(c => `<option value="${c}" ${+d.cuotas === c ? 'selected' : ''}>${c ? c + ' cuotas' : 'Sin cuotas'}</option>`).join('')}</select></label><label class="f" for="e-sena">Seña para reservar (%)<input class="in num" id="e-sena" type="number" min="0" max="100" value="${d.sena || 0}"></label><label class="f" for="e-cupos">Lugares disponibles <small class="muted">(0 = no mostrar)</small><input class="in num" id="e-cupos" type="number" min="0" max="9999" value="${d.cupos}"></label></div>
      <label class="f" for="e-regimen">Régimen de comidas<input class="in" id="e-regimen" value="${esc(d.regimen)}" list="regs" maxlength="60"><datalist id="regs"><option>All inclusive</option><option>Pensión completa</option><option>Media pensión</option><option>Desayuno</option><option>Solo alojamiento</option></datalist></label>
    </div>
    <div class="pane" data-pane="t3" hidden>
      <div class="g2"><label class="f" for="e-transp">Transporte<select class="in" id="e-transp">${opt(['Aéreo', 'Bus', 'Crucero', 'Sin transporte'], d.transporte)}</select></label><label class="f" for="e-desde">Sale desde<input class="in" id="e-desde" value="${esc(d.salidaDesde)}" list="ciudades" maxlength="60"><datalist id="ciudades">${Object.keys(ORIGEN).map(c => `<option>${c}</option>`).join('')}</datalist></label></div>
      <div class="f" style="display:grid;gap:8px;font-size:.9rem;font-weight:700">Fechas de salida
        <div class="adder"><label class="sr-only" for="e-fecha">Nueva fecha</label><input class="in" id="e-fecha" type="date" min="${hoy()}"><button class="btn" type="button" id="addDate">Agregar fecha</button></div>
        <div id="dates"></div><small class="muted" style="font-weight:400">Las fechas que ya pasaron se ocultan solas de la web.</small></div>
      <div class="g2"><label class="f" for="e-hotel">Hotel <small class="muted">(opcional)</small><input class="in" id="e-hotel" value="${esc(d.hotel)}" maxlength="120"></label><label class="f" for="e-estr">Categoría<select class="in" id="e-estr">${[0, 2, 3, 4, 5].map(s => `<option value="${s}" ${+d.estrellas === s ? 'selected' : ''}>${s ? '★'.repeat(s) + ' ' + s + ' estrellas' : 'Sin indicar'}</option>`).join('')}</select></label></div>
      <label class="f" for="e-coord">Coordenadas para la postal <small class="muted">(opcional, ej.: 18°34′N 68°24′O)</small><input class="in" id="e-coord" value="${esc(d.coord)}" maxlength="40"></label>
    </div>
    <div class="pane" data-pane="t4" hidden>
      <p class="help">Día por día, como lo va a leer el viajero en la página del paquete.</p>
      <div class="days" id="days"></div>
      <div><button class="btn" type="button" id="addDay">+ Agregar día</button></div>
    </div>
    <div class="pane" data-pane="t5" hidden>
      <div class="f" style="display:grid;gap:8px;font-size:.9rem;font-weight:700">Incluye
        <div class="adder"><label class="sr-only" for="e-inc">Agregar a incluye</label><input class="in" id="e-inc" placeholder="Ej.: Excursión a Isla Saona" list="incs" maxlength="160"><datalist id="incs">${INCLUYE.map(x => `<option>${x}</option>`).join('')}<option>Excursiones</option><option>Seguro de cancelación</option></datalist><button class="btn" type="button" id="addInc">Agregar</button></div><div id="incList"></div></div>
      <div class="f" style="display:grid;gap:8px;font-size:.9rem;font-weight:700">No incluye
        <div class="adder"><label class="sr-only" for="e-noinc">Agregar a no incluye</label><input class="in" id="e-noinc" placeholder="Ej.: Propinas" maxlength="160"><button class="btn" type="button" id="addNoInc">Agregar</button></div><div id="noIncList"></div></div>
    </div>
    <div class="pane" data-pane="t6" hidden>
      <label class="drop" id="drop" for="e-files"><b>Arrastrá fotos acá</b> o tocá para elegirlas<br><small>JPG, PNG o WebP · la web las optimiza sola · la primera es la portada</small><input id="e-files" type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple hidden></label>
      <p class="help" id="subiendo" hidden></p>
      <div class="photos" id="photos"></div>
    </div>
    <div class="pane" data-pane="t7" hidden>
      <p class="help">Así se va a ver este paquete en Google. Si dejás los campos vacíos, los armamos con el nombre y el resumen.</p>
      <label class="f" for="e-slug">Dirección de la página<input class="in" id="e-slug" value="${esc(d.slug)}" maxlength="90" placeholder="se arma con el nombre"><small class="muted" style="font-weight:400">Conviene no cambiarla una vez publicada: Google ya la conoce.</small></label>
      <label class="f" for="e-seoT">Título para Google<input class="in" id="e-seoT" value="${esc(d.seoTitulo)}" maxlength="90"><span class="count-hint" data-count="e-seoT" data-max="60"></span></label>
      <label class="f" for="e-seoD">Descripción para Google<textarea class="in" id="e-seoD" maxlength="220">${esc(d.seoDescripcion)}</textarea><span class="count-hint" data-count="e-seoD" data-max="155"></span></label>
      <div class="serp" aria-label="Vista previa en Google"><div class="u">${esc(dominio)} › paquetes › <span id="s-slug"></span></div><div class="t" id="s-t"></div><div class="d" id="s-d"></div></div>
    </div>
  </form>
  <div class="drawer-f">${isNew ? '' : '<button class="btn danger" id="delPk" style="margin-right:auto">Eliminar</button>'}<button class="btn" data-close>Cancelar</button><button class="btn pri" id="savePk">${isNew ? 'Crear paquete' : 'Guardar cambios'}</button></div>`);
  const f = $('#pkForm');
  const sync = () => {
    $$('[data-count]', dr).forEach(h => { const n = $('#' + h.dataset.count).value.length, max = +h.dataset.max; h.textContent = `${n} / ${max}`; h.classList.toggle('bad', n > max); });
    const pr = parseNum($('#e-precio').value), mon = $('#e-moneda').value;
    $('#e-ars').textContent = mon === 'USD' ? (S.config.cotizacion ? `Referencia en pesos: ARS ${nf.format(pr * S.config.cotizacion)} (USD 1 = ARS ${nf.format(S.config.cotizacion)}, se cambia en Configuración).` : 'Sin dólar de referencia cargado: la web no muestra el precio en pesos.') : 'Los precios se muestran en pesos, sin conversión.';
    const nom = $('#e-nombre').value || 'Nombre del paquete';
    $('#s-slug').textContent = slug($('#e-slug').value || nom) || 'nuevo';
    $('#s-t').textContent = $('#e-seoT').value || `${nom} · Paquete desde ${$('#e-desde').value || 'Córdoba'} · ${S.config.agencia.nombre}`;
    $('#s-d').textContent = $('#e-seoD').value || `${nom}: ${$('#e-noches').value} noches, salida desde ${$('#e-desde').value || 'Córdoba'}${pr ? `, desde ${mon} ${nf.format(pr)} por persona` : ''}. ${$('#e-resumen').value}`.slice(0, 160);
    $('#e-iata').placeholder = iata({ destino: $('#e-destino').value || $('#e-nombre').value });
  };
  f.addEventListener('input', sync); f.addEventListener('change', sync); sync();
  const drawDates = () => { d.salidas.sort(); chipList($('#dates'), d.salidas.map(fdate), 'neutral'); };
  drawDates();
  $('#addDate').onclick = () => { const v = $('#e-fecha').value; if (!v) { toast('Elegí una fecha en el calendario.'); return; } if (!d.salidas.includes(v)) d.salidas.push(v); drawDates(); $('#e-fecha').value = ''; };
  $('#dates').onclick = e => { const b = e.target.closest('[data-rm]'); if (b) { d.salidas.splice(+b.dataset.rm, 1); drawDates(); } };
  const drawDays = () => { $('#days').innerHTML = d.itinerario.map((x, i) => `<div class="day"><span class="n">${i + 1}</span><div class="fields"><label class="sr-only" for="dt-${i}">Título del día ${i + 1}</label><input class="in" id="dt-${i}" data-dt="${i}" value="${esc(x.t)}" placeholder="Título del día" maxlength="120"><label class="sr-only" for="dd-${i}">Detalle del día ${i + 1}</label><textarea class="in" id="dd-${i}" data-dd="${i}" style="min-height:60px" placeholder="Qué se hace ese día" maxlength="1500">${esc(x.d)}</textarea></div><button type="button" class="btn icon-btn sm" data-rmday="${i}" aria-label="Quitar día ${i + 1}">✕</button></div>`).join('') || '<p class="help">Todavía no hay días cargados.</p>'; };
  drawDays();
  $('#days').addEventListener('input', e => { const t = e.target; if (t.dataset.dt) d.itinerario[+t.dataset.dt].t = t.value; if (t.dataset.dd) d.itinerario[+t.dataset.dd].d = t.value; });
  $('#days').onclick = e => { const b = e.target.closest('[data-rmday]'); if (b) { d.itinerario.splice(+b.dataset.rmday, 1); drawDays(); } };
  $('#addDay').onclick = () => { d.itinerario.push({ t: '', d: '' }); drawDays(); $(`#dt-${d.itinerario.length - 1}`).focus(); };
  const list = (btn, input, key, el, cls) => { const draw = () => chipList($(el), d[key], cls); draw(); $(btn).onclick = () => { const v = $(input).value.trim(); if (!v) return; d[key].push(v); $(input).value = ''; draw(); }; $(input).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $(btn).click(); } }); $(el).onclick = e => { const b = e.target.closest('[data-rm]'); if (b) { d[key].splice(+b.dataset.rm, 1); draw(); } }; };
  list('#addInc', '#e-inc', 'incluye', '#incList', '');
  list('#addNoInc', '#e-noinc', 'noIncluye', '#noIncList', 'neutral');
  const drawPhotos = () => { $('#photos').innerHTML = d.fotos.map((s, i) => `<figure><img src="${esc(s)}" alt="Foto ${i + 1}">${i === 0 ? '<figcaption>Portada</figcaption>' : `<button type="button" class="cover" data-cov="${i}">Usar de portada</button>`}<button type="button" class="x" data-rmf="${i}" aria-label="Quitar foto">✕</button></figure>`).join(''); };
  drawPhotos();
  let subiendo = 0;
  const estadoSubida = () => { const s = $('#subiendo'); if (!s) return; s.hidden = !subiendo; s.textContent = `Subiendo ${subiendo} foto${subiendo === 1 ? '' : 's'}…`; };
  const addFiles = async files => {
    for (const file of [...files]) {
      if (d.fotos.length >= 20) { toast('Máximo 20 fotos por paquete.'); break; }
      subiendo++; estadoSubida();
      try { d.fotos.push(await subirImagen(file, 'foto')); drawPhotos(); }
      catch (err) { toast(err.message); }
      finally { subiendo--; estadoSubida(); }
    }
  };
  $('#e-files').onchange = e => { addFiles(e.target.files); e.target.value = ''; };
  const drop = $('#drop'); ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); })); ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => addFiles(e.dataTransfer.files));
  $('#photos').onclick = e => { const rm = e.target.closest('[data-rmf]'), cv = e.target.closest('[data-cov]'); if (rm) { d.fotos.splice(+rm.dataset.rmf, 1); drawPhotos(); } if (cv) { const [x] = d.fotos.splice(+cv.dataset.cov, 1); d.fotos.unshift(x); drawPhotos(); } };
  $('#savePk').onclick = async () => {
    if (subiendo) { toast('Esperá a que terminen de subir las fotos.'); tabTo('t6'); return; }
    const nom = $('#e-nombre').value.trim(), pr = Math.round(parseNum($('#e-precio').value));
    if (nom.length < 4) { toast('El nombre necesita al menos 4 letras.'); tabTo('t1'); $('#e-nombre').focus(); return; }
    const est = f.querySelector('input[name=estado]:checked').value;
    if (est === 'publicado' && !pr) { toast('Para publicar, poné un precio mayor a 0.'); tabTo('t2'); $('#e-precio').focus(); return; }
    if (est === 'publicado' && !d.fotos.length) { toast('Para publicar, subí al menos una foto.'); tabTo('t6'); return; }
    const opt2 = id => Math.round(parseNum($(id).value));
    const cuerpo = { nombre: nom, slug: $('#e-slug').value.trim() || undefined, destino: $('#e-destino').value.trim() || nom, pais: $('#e-pais').value.trim(), iata: $('#e-iata').value.trim().toUpperCase(), region: $('#e-region').value, tipo: $('#e-tipo').value.trim() || 'Playa', etiqueta: $('#e-etq').value.trim(), etiquetaColor: f.querySelector('input[name=etqc]:checked')?.value || 'rojo', resumen: $('#e-resumen').value.trim(), descripcion: $('#e-desc').value.trim(), estado: est, destacado: $('#e-dest').checked, moneda: $('#e-moneda').value, precio: pr, precioSingle: opt2('#e-single'), precioTriple: opt2('#e-triple'), precioMenor: opt2('#e-menor'), cuotas: +$('#e-cuotas').value, sena: +$('#e-sena').value || 0, noches: +$('#e-noches').value || 0, cupos: +$('#e-cupos').value || 0, regimen: $('#e-regimen').value.trim(), transporte: $('#e-transp').value, salidaDesde: $('#e-desde').value.trim() || 'Córdoba', salidas: d.salidas, hotel: $('#e-hotel').value.trim(), estrellas: +$('#e-estr').value, coord: $('#e-coord').value.trim(), itinerario: d.itinerario.map(x => ({ t: x.t.trim(), d: x.d.trim() })).filter(x => x.t || x.d), incluye: d.incluye, noIncluye: d.noIncluye, fotos: d.fotos, seoTitulo: $('#e-seoT').value.trim(), seoDescripcion: $('#e-seoD').value.trim() };
    await accion($('#savePk'), async () => {
      const j = isNew ? await api('POST', '/api/panel/paquetes', cuerpo) : await api('PUT', `/api/panel/paquetes/${d.id}`, cuerpo);
      if (isNew) S.paquetes.push(j.paquete); else reemplazar(S.paquetes, j.paquete);
      toast(est === 'publicado' ? 'Guardado. En menos de un minuto se ve en la web.' : `Guardado como ${EST[est][1].toLowerCase()}. No se ve en la web.`);
      closeDrawer(); if (current === 'paquetes') rows(); else go('paquetes');
      refrescarActividad();
    });
  };
  $('#delPk')?.addEventListener('click', () => ask(`¿Eliminar "${d.nombre}"?`, 'Se quita de la web junto con sus ofertas. Esta acción no se puede deshacer.', 'Eliminar', async () => {
    await accion(null, async () => { await api('DELETE', `/api/panel/paquetes/${d.id}`); S.paquetes = S.paquetes.filter(x => x.id !== d.id); S.ofertas = S.ofertas.filter(o => o.paqueteId !== d.id); sel.delete(d.id); toast('Paquete eliminado.'); closeDrawer(); rows(); refrescarActividad(); });
  }));
}
function ask(title, body, okLabel, fn) {
  const dl = $('#confirm');
  dl.innerHTML = `<div class="dlg-h"><h2 id="cf-t">${esc(title)}</h2></div><div class="dlg-b"><p style="margin:0">${esc(body)}</p><div class="row" style="justify-content:flex-end"><button class="btn" id="cfNo">Cancelar</button><button class="btn pri" id="cfOk">${esc(okLabel)}</button></div></div>`;
  dl.showModal(); $('#cfNo').onclick = () => dl.close(); $('#cfOk').onclick = () => { dl.close(); fn(); };
}

/* ---------- aumento masivo ---------- */
function bulk() {
  const dl = $('#bulk');
  dl.innerHTML = `<div class="dlg-h"><h2 id="bk-t">Actualizar precios en bloque</h2><button class="btn icon-btn" id="bkX" aria-label="Cerrar">✕</button></div>
  <div class="dlg-b">
    <div class="g2">
      <label class="f" for="bk-scope">Aplicar a<select class="in" id="bk-scope"><option value="all">Todos los paquetes</option>${sel.size ? `<option value="sel" selected>Los ${sel.size} seleccionados</option>` : ''}${Object.entries(S.regiones).filter(([k]) => S.paquetes.some(p => p.region === k)).map(([k, v]) => `<option value="${k}">Solo ${v}</option>`).join('')}</select></label>
      <label class="f" for="bk-pct">Cambio (%) <small class="muted">(negativo para bajar)</small><input class="in num" id="bk-pct" type="number" step="0.5" value="5" min="-90" max="300"></label>
    </div>
    <label class="f" for="bk-round">Redondeo<select class="in" id="bk-round"><option value="1">Sin redondeo</option><option value="10" selected>A la decena (1.990)</option><option value="50">A múltiplos de 50</option><option value="100">A múltiplos de 100</option></select></label>
    <div class="tbl-wrap" style="max-height:240px;overflow:auto;border:1px solid var(--line);border-radius:12px"><table class="diff"><thead><tr><th>Paquete</th><th class="r">Antes</th><th class="r">Después</th></tr></thead><tbody id="bkRows"></tbody></table></div>
    <p class="help" style="margin:0">También se actualizan los precios single, triple y de menores.</p>
    <div class="row" style="justify-content:flex-end"><button class="btn" id="bkNo">Cancelar</button><button class="btn pri" id="bkOk">Aplicar cambios</button></div>
  </div>`;
  const calc = () => {
    const sc = $('#bk-scope').value, pct = +$('#bk-pct').value || 0, rd = +$('#bk-round').value;
    const out = S.paquetes.filter(p => sc === 'all' || (sc === 'sel' ? sel.has(p.id) : p.region === sc)).map(p => { const v = p.precio > 0 ? Math.max(1, Math.round(p.precio * (1 + pct / 100) / rd) * rd) : 0; return [p, v]; });
    $('#bkRows').innerHTML = out.map(([p, v]) => `<tr><td>${esc(p.nombre)}</td><td class="r">${money(p.precio, p.moneda)}</td><td class="r ${v > p.precio ? 'up' : ''}">${money(v, p.moneda)}</td></tr>`).join('') || '<tr><td colspan="3" class="empty">No hay paquetes en esta selección.</td></tr>';
    return { out, sc, pct, rd };
  };
  dl.oninput = calc; calc(); dl.showModal();
  $('#bkX').onclick = $('#bkNo').onclick = () => dl.close();
  $('#bkOk').onclick = () => accion($('#bkOk'), async () => {
    const { out, sc, pct, rd } = calc(); if (!out.length) return;
    if (!pct) { toast('Escribí un porcentaje distinto de 0.'); return; }
    const j = await api('POST', '/api/panel/paquetes/precios', { ids: out.map(([p]) => p.id), region: sc, porcentaje: pct, redondeo: rd });
    j.paquetes.forEach(p => reemplazar(S.paquetes, p));
    toast(`Listo: ${j.paquetes.length} precios actualizados en la web.`); dl.close(); if (current === 'paquetes') rows(); refrescarActividad();
  });
}

/* ---------- ofertas (varias activas a la vez) ---------- */
const offerPrice = (o, p) => o.precioFinal ? o.precioFinal : Math.round(p.precio * (1 - (o.descuento || 0) / 100));
const offerState = o => { const now = Date.now(), p = pk(o.paqueteId); if (!o.activa) return ['off', 'Apagada']; if (new Date(o.hasta) <= now) return ['off', 'Vencida']; if (p && p.estado !== 'publicado') return ['warn', 'Paquete oculto']; if (new Date(o.desde) > now) return ['warn', 'Programada']; return ['hot', 'En la web']; };
VIEWS.ofertas = () => {
  const now = Date.now(), live = S.ofertas.filter(o => offerState(o)[1] === 'En la web').length;
  V(`<div class="row" style="justify-content:space-between"><p class="muted" style="margin:0">Podés tener varias ofertas en la web al mismo tiempo. Cada una se muestra como tarjeta de embarque y se oculta sola cuando vence. <b style="color:var(--ink)">${live} en la web ahora.</b></p><button class="btn pri" data-act="new-of">+ Nueva oferta</button></div>
  <div class="offers">${S.ofertas.map(o => { const p = pk(o.paqueteId); if (!p) return ''; const [cls, lab] = offerState(o); const left = Math.max(0, new Date(o.hasta) - now); const dd = Math.floor(left / DAY), hh = Math.floor(left % DAY / 36e5);
    return `<article class="card offer" data-of="${esc(o.id)}">
      <div class="offer-top"><span>${esc(o.etiqueta || 'Oferta')}</span><span class="pill ${cls}">${lab}</span></div>
      <div class="offer-route"><div><b>${esc(ORIGEN[p.salidaDesde] || p.salidaDesde.slice(0, 3).toUpperCase())}</b><small>${esc(p.salidaDesde)}</small></div><span class="line">${PLANE}</span><div style="text-align:right"><b>${esc(iata(p))}</b><small>${esc(p.destino)}</small></div></div>
      <h3>${esc(o.titulo)}</h3><div class="sub">${esc(p.nombre)}</div>
      <div class="prices"><span class="big">${money(offerPrice(o, p), p.moneda)}</span><s class="muted">${money(p.precio, p.moneda)}</s>${o.precioFinal ? '' : `<span class="pill info">−${o.descuento} %</span>`}</div>
      <div class="meta"><span>Desde ${new Date(o.desde).toLocaleDateString('es-AR')}</span><span>Hasta ${new Date(o.hasta).toLocaleDateString('es-AR')}</span><span>${o.contador ? 'Con cuenta regresiva' : 'Sin cuenta regresiva'}</span>${o.cupos ? `<span>${o.cupos} lugares</span>` : ''}</div>
      <div class="stub"><label class="switch"><input type="checkbox" data-of-on ${o.activa ? 'checked' : ''}><i></i>Mostrar en la web</label><span class="row" style="gap:8px">${left && o.activa ? `<small class="muted">Termina en ${dd} d ${hh} h</small>` : ''}<button class="btn sm" data-of-edit>Editar</button></span></div>
    </article>`; }).join('') || '<div class="card empty">Todavía no hay ofertas.</div>'}</div>`);
};
$('#view').addEventListener('change', async e => {
  const card = e.target.closest('[data-of]'); if (!card || !e.target.matches('[data-of-on]')) return;
  const o = S.ofertas.find(x => x.id === card.dataset.of), activa = e.target.checked;
  try { const j = await api('PATCH', `/api/panel/ofertas/${o.id}`, { activa }); reemplazar(S.ofertas, j.oferta); toast(activa ? 'Listo. En menos de un minuto se ve en la web.' : 'Oferta oculta de la web.'); refrescarActividad(); }
  catch (err) { toast(err.message); e.target.checked = !activa; }
  VIEWS.ofertas();
});
$('#view').addEventListener('click', e => { const b = e.target.closest('[data-of-edit]'); if (b) editOffer(S.ofertas.find(x => x.id === b.closest('[data-of]').dataset.of)); });
function editOffer(o) {
  const isNew = !o, pubs = S.paquetes.filter(p => p.estado === 'publicado');
  if (isNew && !pubs.length) { toast('Primero publicá al menos un paquete.'); return; }
  const d = o ? structuredClone(o) : { paqueteId: pubs[0].id, titulo: '', etiqueta: 'Oferta relámpago', descuento: 10, precioFinal: 0, desde: new Date().toISOString(), hasta: new Date(Date.now() + 7 * DAY).toISOString(), activa: true, contador: true, cupos: 0, nota: '' };
  const modo = d.precioFinal ? 'fijo' : 'pct';
  openDrawer(`
  <div class="drawer-h"><h2 id="dr-t">${isNew ? 'Nueva oferta' : 'Editar oferta'}</h2><button class="btn icon-btn" data-close aria-label="Cerrar">✕</button></div>
  <form class="drawer-b" id="ofForm" novalidate>
    <label class="f" for="o-pk">Paquete en oferta<select class="in" id="o-pk">${S.paquetes.map(p => `<option value="${esc(p.id)}" ${p.id === d.paqueteId ? 'selected' : ''}>${esc(p.nombre)} · ${money(p.precio, p.moneda)}${p.estado !== 'publicado' ? ' (no publicado)' : ''}</option>`).join('')}</select></label>
    <div class="g2"><label class="f" for="o-tit">Título de la oferta<input class="in" id="o-tit" value="${esc(d.titulo)}" maxlength="80" placeholder="Ej.: Caribe de último minuto"></label>
    <label class="f" for="o-etq">Etiqueta<input class="in" id="o-etq" value="${esc(d.etiqueta)}" maxlength="30" list="oetqs"><datalist id="oetqs"><option>Oferta relámpago</option><option>Preventa</option><option>Black Friday</option><option>Hot Sale</option><option>Especial novios</option><option>Último minuto</option></datalist></label></div>
    <fieldset style="border:0;padding:0;margin:0;display:grid;gap:8px"><legend style="font-size:.9rem;font-weight:700;margin-bottom:6px">Cómo se calcula el precio</legend>
      <div class="radio-row"><label><input type="radio" name="modo" value="pct" ${modo === 'pct' ? 'checked' : ''}>Descuento en %</label><label><input type="radio" name="modo" value="fijo" ${modo === 'fijo' ? 'checked' : ''}>Precio final fijo</label></div></fieldset>
    <div class="g2"><label class="f" for="o-pct" id="o-pct-l">Descuento (%)<input class="in num" id="o-pct" type="number" min="1" max="90" value="${d.descuento || 10}"></label><label class="f" for="o-fijo" id="o-fijo-l">Precio final por persona<input class="in num" id="o-fijo" inputmode="numeric" value="${d.precioFinal ? nf.format(d.precioFinal) : ''}"></label></div>
    <p class="help" id="o-calc"></p>
    <div class="g2"><label class="f" for="o-desde">Empieza<input class="in" id="o-desde" type="datetime-local" value="${localDT(d.desde)}"></label><label class="f" for="o-vence">Termina<input class="in" id="o-vence" type="datetime-local" value="${localDT(d.hasta)}"></label></div>
    <div class="g2"><label class="f" for="o-cupos">Lugares para la oferta <small class="muted">(0 = los del paquete)</small><input class="in num" id="o-cupos" type="number" min="0" value="${d.cupos}"></label>
    <div style="display:grid;gap:10px;align-content:end"><label class="switch"><input type="checkbox" id="o-cd" ${d.contador ? 'checked' : ''}><i></i>Mostrar cuenta regresiva</label><label class="switch"><input type="checkbox" id="o-on" ${d.activa ? 'checked' : ''}><i></i>Mostrar en la web</label></div></div>
    <label class="f" for="o-nota">Nota corta <small class="muted">(opcional, aparece en la tarjeta)</small><input class="in" id="o-nota" value="${esc(d.nota)}" maxlength="140"></label>
  </form>
  <div class="drawer-f">${isNew ? '' : '<button class="btn danger" id="delOf" style="margin-right:auto">Eliminar</button>'}<button class="btn" data-close>Cancelar</button><button class="btn pri" id="saveOf">${isNew ? 'Crear oferta' : 'Guardar cambios'}</button></div>`);
  const f = $('#ofForm');
  const sync = () => {
    const m = f.querySelector('input[name=modo]:checked').value, p = pk($('#o-pk').value);
    $('#o-pct-l').hidden = m !== 'pct'; $('#o-fijo-l').hidden = m !== 'fijo';
    const np = m === 'pct' ? Math.round(p.precio * (1 - (+$('#o-pct').value || 0) / 100)) : parseNum($('#o-fijo').value);
    $('#o-calc').textContent = !p.precio ? 'Este paquete no tiene precio cargado.' : np ? `Precio normal ${money(p.precio, p.moneda)} → en oferta ${money(np, p.moneda)} (${nf1.format((1 - np / p.precio) * 100)} % menos).` : 'Escribí el precio final.';
    if (!$('#o-tit').value && isNew) $('#o-tit').placeholder = `Ej.: ${p.destino} de último minuto`;
  };
  f.addEventListener('input', sync); f.addEventListener('change', sync); sync();
  $('#saveOf').onclick = () => {
    const m = f.querySelector('input[name=modo]:checked').value, p = pk($('#o-pk').value);
    const desde = new Date($('#o-desde').value), vence = new Date($('#o-vence').value);
    if (!$('#o-tit').value.trim()) { toast('Poné un título a la oferta.'); $('#o-tit').focus(); return; }
    if (isNaN(desde) || isNaN(vence) || vence <= desde) { toast('La fecha de fin tiene que ser posterior a la de inicio.'); $('#o-vence').focus(); return; }
    const pct = +$('#o-pct').value, fijo = Math.round(parseNum($('#o-fijo').value));
    if (m === 'pct' && !(pct >= 1 && pct <= 90)) { toast('El descuento va de 1 % a 90 %.'); return; }
    if (m === 'fijo' && !(fijo > 0 && fijo < p.precio)) { toast('El precio final tiene que ser menor al precio normal.'); return; }
    const cuerpo = { paqueteId: p.id, titulo: $('#o-tit').value.trim(), etiqueta: $('#o-etq').value.trim(), descuento: m === 'pct' ? pct : 0, precioFinal: m === 'fijo' ? fijo : 0, desde: desde.toISOString(), hasta: vence.toISOString(), cupos: +$('#o-cupos').value || 0, contador: $('#o-cd').checked, activa: $('#o-on').checked, nota: $('#o-nota').value.trim() };
    accion($('#saveOf'), async () => {
      const j = isNew ? await api('POST', '/api/panel/ofertas', cuerpo) : await api('PUT', `/api/panel/ofertas/${d.id}`, cuerpo);
      reemplazar(S.ofertas, j.oferta);
      toast(cuerpo.activa ? (p.estado === 'publicado' ? 'Oferta guardada. En menos de un minuto se ve en la web.' : 'Oferta guardada, pero el paquete no está publicado.') : 'Oferta guardada, apagada.'); closeDrawer(); go('ofertas'); refrescarActividad();
    });
  };
  $('#delOf')?.addEventListener('click', () => ask(`¿Eliminar "${d.titulo}"?`, 'La oferta se quita de la web.', 'Eliminar', () => accion(null, async () => { await api('DELETE', `/api/panel/ofertas/${d.id}`); S.ofertas = S.ofertas.filter(x => x.id !== d.id); toast('Oferta eliminada.'); closeDrawer(); VIEWS.ofertas(); refrescarActividad(); })));
}

/* ---------- reseñas de Google ---------- */
VIEWS.resenas = () => {
  const r = S.config.resenas;
  V(`<div class="card"><div class="card-h"><div><h2>Reseñas que se muestran en la web</h2><span class="sub">Copiá las mejores de tu perfil de Google. Se muestran en el carrusel de la portada.</span></div><button class="btn pri" id="rvNueva">+ Agregar reseña</button></div>
    <div class="tbl-wrap"><table><thead><tr><th>Autor</th><th>Reseña</th><th>Estrellas</th><th>En la web</th><th></th></tr></thead><tbody>
    ${S.resenas.map(x => `<tr data-rv="${esc(x.id)}"><td><b>${esc(x.autor)}</b><br><small class="muted">${esc(x.cuando)}</small></td><td class="muted" style="max-width:460px">${esc(x.texto.length > 140 ? x.texto.slice(0, 140) + '…' : x.texto)}</td><td style="color:#e0a000;white-space:nowrap">${'★'.repeat(x.estrellas)}</td><td>${x.activa ? '<span class="pill ok">Visible</span>' : '<span class="pill off">Oculta</span>'}</td><td><button class="btn sm" data-rv-edit>Editar</button></td></tr>`).join('') || '<tr><td colspan="5" class="empty">Todavía no hay reseñas. Mientras no cargues ninguna, la sección no aparece en la web.</td></tr>'}
    </tbody></table></div></div>
    ${puede('config') ? `<form class="card" id="rvMeta"><div class="card-h"><div><h2>Puntaje en Google</h2><span class="sub">Lo que figura en tu perfil de empresa de Google</span></div></div>
    <div class="card-b" style="display:grid;gap:14px"><div class="g3">
      <label class="f" for="rv-p">Puntaje promedio<input class="in num" id="rv-p" type="number" min="0" max="5" step="0.1" value="${r.puntaje}"></label>
      <label class="f" for="rv-c">Cantidad de reseñas<input class="in num" id="rv-c" type="number" min="0" value="${r.cantidad}"></label>
      <label class="f" for="rv-u">Enlace a tu perfil de Google <small class="muted">(botón “Dejanos tu reseña”)</small><input class="in" id="rv-u" value="${esc(r.perfil)}" placeholder="https://g.page/r/…/review"></label>
    </div></div><div class="drawer-f" style="border-radius:0 0 16px 16px"><button class="btn pri" type="submit">Guardar puntaje</button></div></form>` : ''}`);
  $('#rvNueva').onclick = () => editResena(null);
  $('#rvMeta')?.addEventListener('submit', e => { e.preventDefault(); guardarConfig(e.submitter, c => { c.resenas = { puntaje: +$('#rv-p').value || 0, cantidad: +$('#rv-c').value || 0, perfil: $('#rv-u').value.trim() }; }, 'Puntaje guardado.'); });
};
$('#view').addEventListener('click', e => { const b = e.target.closest('[data-rv-edit]'); if (b) editResena(S.resenas.find(x => x.id === b.closest('[data-rv]').dataset.rv)); });
function editResena(r) {
  const isNew = !r, d = r || { autor: '', texto: '', estrellas: 5, cuando: '', activa: true, orden: S.resenas.length };
  openDrawer(`<div class="drawer-h"><h2 id="dr-t">${isNew ? 'Nueva reseña' : 'Editar reseña'}</h2><button class="btn icon-btn" data-close aria-label="Cerrar">✕</button></div>
  <form class="drawer-b" id="rvForm" novalidate>
    <div class="g2"><label class="f" for="r-autor">Nombre de quien la escribió<input class="in" id="r-autor" value="${esc(d.autor)}" maxlength="80"></label><label class="f" for="r-cuando">Cuándo <small class="muted">(como figura en Google)</small><input class="in" id="r-cuando" value="${esc(d.cuando)}" maxlength="40" placeholder="hace 2 semanas"></label></div>
    <label class="f" for="r-texto">Texto de la reseña<textarea class="in" id="r-texto" style="min-height:140px" maxlength="1200">${esc(d.texto)}</textarea></label>
    <div class="g2"><label class="f" for="r-est">Estrellas<select class="in" id="r-est">${[5, 4, 3, 2, 1].map(n => `<option value="${n}" ${d.estrellas === n ? 'selected' : ''}>${'★'.repeat(n)} ${n}</option>`).join('')}</select></label><label class="f" for="r-orden">Orden <small class="muted">(menor = primero)</small><input class="in num" id="r-orden" type="number" min="0" value="${d.orden}"></label></div>
    <label class="switch"><input type="checkbox" id="r-on" ${d.activa ? 'checked' : ''}><i></i>Mostrar en la web</label>
  </form>
  <div class="drawer-f">${isNew ? '' : '<button class="btn danger" id="delRv" style="margin-right:auto">Eliminar</button>'}<button class="btn" data-close>Cancelar</button><button class="btn pri" id="saveRv">${isNew ? 'Agregar' : 'Guardar'}</button></div>`);
  $('#saveRv').onclick = () => accion($('#saveRv'), async () => {
    const cuerpo = { autor: $('#r-autor').value.trim(), cuando: $('#r-cuando').value.trim(), texto: $('#r-texto').value.trim(), estrellas: +$('#r-est').value, orden: +$('#r-orden').value || 0, activa: $('#r-on').checked };
    const j = isNew ? await api('POST', '/api/panel/resenas', cuerpo) : await api('PUT', `/api/panel/resenas/${d.id}`, cuerpo);
    reemplazar(S.resenas, j.resena); S.resenas.sort((a, b) => a.orden - b.orden); toast('Reseña guardada.'); closeDrawer(); VIEWS.resenas(); refrescarActividad();
  });
  $('#delRv')?.addEventListener('click', () => ask(`¿Eliminar la reseña de ${d.autor}?`, 'Se quita de la web.', 'Eliminar', () => accion(null, async () => { await api('DELETE', `/api/panel/resenas/${d.id}`); S.resenas = S.resenas.filter(x => x.id !== d.id); toast('Reseña eliminada.'); closeDrawer(); VIEWS.resenas(); })));
}

/* ---------- consultas ---------- */
let cSel = null, cFil = 'todas';
VIEWS.consultas = () => {
  const list = S.consultas.filter(c => cFil === 'todas' || c.estado === cFil);
  if (!cSel || !list.find(c => c.id === cSel)) cSel = list[0]?.id;
  const c = S.consultas.find(x => x.id === cSel);
  const wa = c && c.telefono.replace(/\D/g, '');
  V(`<div class="card"><div class="toolbar"><div class="row" role="group" aria-label="Filtrar consultas">${[['todas', 'Todas'], ['nueva', 'Nuevas'], ['contactada', 'Contactadas'], ['cerrada', 'Cerradas']].map(([k, v]) => `<button class="btn sm ${cFil === k ? 'pri' : ''}" data-cf="${k}">${v}</button>`).join('')}</div><span class="row" style="margin-left:auto;gap:8px"><a class="btn sm" href="/api/panel/exportar?que=consultas" download>Descargar en Excel</a></span></div>
  <div class="inbox"><ul class="list" role="listbox" aria-label="Consultas">${list.map(x => `<li role="option" data-cid="${x.id}" aria-selected="${x.id === cSel}">${x.estado === 'nueva' ? '<span class="dot-new" aria-label="Nueva"></span>' : '<span style="width:9px;flex:none"></span>'}<div class="grow"><div class="t">${esc(x.nombre)}</div><div class="s">${esc(destinoDe(x) || 'Sin destino definido')} · ${esc((x.mensaje || x.telefono).slice(0, 60))}</div></div><span class="s">${rel(x.creado)}</span></li>`).join('') || '<li class="empty">No hay consultas en esta bandeja. Llegan desde el formulario de la web.</li>'}</ul>
  <div class="detail">${c ? `<div class="row" style="justify-content:space-between"><h2 style="margin:0;font-size:1.3rem">${esc(c.nombre)}</h2><label class="sr-only" for="c-est">Estado</label><select class="in" id="c-est" style="width:auto">${['nueva', 'contactada', 'cerrada'].map(s => `<option value="${s}" ${c.estado === s ? 'selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`).join('')}</select></div>
    <div class="g2" style="font-size:.95rem"><div><span class="muted">Teléfono</span><br><a href="tel:${esc(c.telefono.replace(/[^\d+]/g, ''))}">${esc(c.telefono)}</a></div><div><span class="muted">Email</span><br><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></div><div><span class="muted">Destino</span><br>${esc(destinoDe(c) || 'Todavía no sabe')}</div><div><span class="muted">Quiere viajar</span><br>${c.fechaViaje ? esc(c.fechaViaje.split('-').reverse().join('/')) : 'Sin fecha'}</div></div>
    <p style="margin:0;padding:14px;border-radius:12px;background:var(--panel-2);border:1px solid var(--line);white-space:pre-wrap">${esc(c.mensaje) || '<span class="muted">Sin mensaje.</span>'}</p>
    <div class="row"><a class="btn pri" href="https://wa.me/${wa}?text=${encodeURIComponent('Hola ' + c.nombre.split(' ')[0] + '! Te escribimos de ' + S.config.agencia.nombre + ' por tu consulta' + (c.destino && c.destino !== 'Todavía no sé' ? ' de ' + c.destino : '') + '.')}" target="_blank" rel="noopener">Responder por WhatsApp</a><a class="btn" href="mailto:${esc(c.email)}?subject=${encodeURIComponent('Tu consulta en ' + S.config.agencia.nombre)}">Responder por email</a><span class="muted" style="font-size:.88rem">Recibida ${rel(c.creado)}</span><button class="btn sm danger" id="c-del" style="margin-left:auto">Eliminar</button></div>` : '<p class="empty">Elegí una consulta para ver el detalle.</p>'}</div></div></div>
  <div class="card"><div class="card-h"><div><h2>Club de ofertas</h2><span class="sub">${nf.format(S.suscriptores)} persona${S.suscriptores === 1 ? '' : 's'} se sumaron desde el pie de la web</span></div><a class="btn sm" href="/api/panel/exportar?que=suscriptores" download>Descargar emails</a></div></div>
  <div class="card"><div class="card-h"><div><h2>Botón de arrepentimiento</h2><span class="sub">Solicitudes recibidas por la web · respondé dentro de las 24 h</span></div></div>
    <div class="tbl-wrap"><table><thead><tr><th>Código</th><th>Nombre</th><th>DNI</th><th>Email</th><th>Reserva</th><th>Fecha</th></tr></thead><tbody>${S.arrepentimientos.map(a => `<tr><td class="num"><b>${esc(a.codigo)}</b></td><td>${esc(a.nombre)}</td><td>${esc(a.dni)}</td><td><a href="mailto:${esc(a.email)}">${esc(a.email)}</a></td><td>${esc(a.reserva)}</td><td>${new Date(a.creado).toLocaleString('es-AR')}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">No hay solicitudes.</td></tr>'}</tbody></table></div></div>`);
  $('#c-del')?.addEventListener('click', () => ask(`¿Eliminar la consulta de ${c.nombre}?`, 'Se borran sus datos de forma definitiva (por ejemplo, si la persona pidió que la borren).', 'Eliminar', () => accion(null, async () => { await api('DELETE', `/api/panel/consultas/${c.id}`); S.consultas = S.consultas.filter(x => x.id !== c.id); cSel = null; toast('Consulta eliminada.'); renderBrand(); VIEWS.consultas(); })));
};
$('#view').addEventListener('click', e => { const li = e.target.closest('[data-cid]'); if (li) { cSel = li.dataset.cid; VIEWS.consultas(); } const fb = e.target.closest('[data-cf]'); if (fb) { cFil = fb.dataset.cf; VIEWS.consultas(); } });
$('#view').addEventListener('change', async e => {
  if (e.target.id !== 'c-est') return;
  const c = S.consultas.find(x => x.id === cSel);
  try { const j = await api('PATCH', `/api/panel/consultas/${c.id}`, { estado: e.target.value }); reemplazar(S.consultas, j.consulta); toast(`Consulta marcada como ${j.consulta.estado}.`); refrescarActividad(); }
  catch (err) { toast(err.message); }
  renderBrand(); VIEWS.consultas();
});

/* ---------- configuración ---------- */
async function guardarConfig(boton, cambiar, mensaje) {
  const c = structuredClone(S.config); cambiar(c);
  const { logo, ...cuerpo } = c;
  return accion(boton, async () => { const j = await api('PUT', '/api/panel/config', cuerpo); S.config = j.config; toast(mensaje); renderBrand(); refrescarActividad(); return true; });
}
VIEWS.config = () => {
  const a = S.config.agencia, G = S.config.google, E = S.entorno, F = S.config.dataFiscal;
  const fld = (k, l, extra = '') => `<label class="f" for="a-${k}">${l}<input class="in" id="a-${k}" value="${esc(a[k])}" ${extra}></label>`;
  V(`<div class="card"><div class="card-h"><div><h2>Logo de la agencia</h2><span class="sub">Aparece en la web, en el panel y en la pantalla de acceso</span></div></div>
    <div class="card-b logo-box"><div class="logo-prev" id="logoPrev">${S.config.logo ? `<img src="${esc(S.config.logo)}" alt="Logo actual">` : DEFAULT_MARK}</div>
    <div style="display:grid;gap:8px"><label class="btn" for="logoFile">Subir logo</label><input id="logoFile" type="file" accept="image/png,image/svg+xml,image/webp,image/jpeg" hidden>${S.config.logo ? '<button class="btn danger" id="logoDel" type="button">Quitar logo</button>' : ''}<small class="muted">PNG o SVG con fondo transparente, horizontal</small></div></div></div>
  <form class="card" id="gForm"><div class="card-h"><div><h2>Google</h2><span class="sub">Para medir visitas en la web y ver búsquedas en el resumen</span></div></div><div class="card-b" style="display:grid;gap:14px">
    <div class="integ"><span class="ic">${GA_LOGO}</span><div><b>Google Analytics 4</b><small>${G.medicion ? `Midiendo la web con ${esc(G.medicion)} (solo si el visitante acepta cookies)` : 'Sin conectar'}</small></div></div>
    <div class="g2"><label class="f" for="g-med">ID de medición <small class="muted">(G-XXXXXXX, para contar visitas)</small><input class="in" id="g-med" value="${esc(G.medicion)}" placeholder="G-XXXXXXXXXX" maxlength="20"></label><label class="f" for="g-prop">ID de propiedad <small class="muted">(solo números, para el resumen)</small><input class="in" id="g-prop" value="${esc(G.propiedad)}" inputmode="numeric" placeholder="123456789" maxlength="20"></label></div>
    <div class="integ"><span class="ic">${SC_LOGO}</span><div><b>Google Search Console</b><small>${G.sitioSearchConsole ? esc(G.sitioSearchConsole) : 'Sin conectar'}</small></div></div>
    <label class="f" for="g-sc">Propiedad de Search Console<input class="in" id="g-sc" value="${esc(G.sitioSearchConsole)}" placeholder="sc-domain:tuagencia.com.ar" maxlength="200"></label>
    <p class="help" style="margin:0">${E.cuentaGoogle ? `Para que el resumen muestre los datos, agregá <b class="copiable">${esc(E.cuentaGoogle)}</b> como <b>lector</b> en Analytics (Administrar › Acceso a la propiedad) y como <b>usuario restringido</b> en Search Console (Configuración › Usuarios y permisos).` : 'Para ver las métricas en el resumen falta configurar la cuenta de servicio de Google en el servidor (lo hace quien administra la web).'}</p>
  </div><div class="drawer-f" style="border-radius:0 0 16px 16px"><button class="btn pri" type="submit">Guardar Google</button></div></form>
  <form class="card" id="cfgForm"><div class="card-h"><div><h2>Datos de la agencia</h2><span class="sub">Aparecen en la web, en el mapa y en Google</span></div></div>
  <div class="card-b" style="display:grid;gap:14px">
    <div class="g2">${fld('nombre', 'Nombre comercial', 'maxlength="60"')}${fld('email', 'Email de contacto', 'type="email" maxlength="120"')}</div>
    <div class="g3">${fld('direccion', 'Dirección', 'maxlength="120"')}${fld('ciudad', 'Ciudad', 'maxlength="80"')}${fld('provincia', 'Provincia', 'maxlength="80"')}</div>
    <div class="g3">${fld('cp', 'Código postal', 'maxlength="12"')}${fld('telefono', 'Teléfono', 'maxlength="40"')}${fld('whatsapp', 'WhatsApp (con código de país)', 'inputmode="numeric" maxlength="20"')}</div>
    <div class="g2">${fld('horario', 'Horario', 'maxlength="160"')}<div class="g2">${fld('lat', 'Latitud', 'inputmode="decimal"')}${fld('lng', 'Longitud', 'inputmode="decimal"')}</div></div>
    <div class="g3">${fld('legajo', 'Legajo EVyT', 'maxlength="20"')}${fld('cuit', 'CUIT', 'maxlength="20"')}${fld('razonSocial', 'Razón social', 'maxlength="120"')}</div>
    <div class="g2">${fld('instagram', 'Instagram (enlace)', 'maxlength="200" placeholder="https://www.instagram.com/tuagencia"')}${fld('facebook', 'Facebook (enlace)', 'maxlength="200" placeholder="https://www.facebook.com/tuagencia"')}</div>
    <div class="g2"><label class="f" for="a-fx">Dólar de referencia (ARS por USD)<input class="in num" id="a-fx" inputmode="numeric" value="${S.config.cotizacion ? nf.format(S.config.cotizacion) : ''}"><small class="muted">Se usa para mostrar el precio aproximado en pesos. Dejalo vacío para no mostrarlo.</small></label>
    <label class="f" for="df-url">Data Fiscal: enlace del QR de ARCA <small class="muted">(opcional)</small><input class="in" id="df-url" value="${esc(F.enlace)}" placeholder="http://qr.afip.gob.ar/?qr=…" maxlength="300"><span class="row" style="gap:8px;margin-top:4px">${F.imagen ? `<img src="${esc(F.imagen)}" alt="QR actual" style="width:44px;height:44px;border-radius:6px;border:1px solid var(--line)">` : ''}<label class="btn sm" for="dfFile">${F.imagen ? 'Cambiar imagen del QR' : 'Subir imagen del QR'}</label><input id="dfFile" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden></span></label></div>
  </div>
  <div class="drawer-f" style="border-radius:0 0 16px 16px"><button class="btn pri" type="submit">Guardar configuración</button></div></form>
  <div class="card"><div class="card-h"><div><h2>Estado del servidor</h2><span class="sub">Servicios conectados a la web</span></div></div><div class="card-b" style="display:grid;gap:8px">
    <div class="row"><span class="pill ${E.email ? 'ok' : 'off'}">${E.email ? 'Activo' : 'Sin configurar'}</span>Aviso por email de cada consulta nueva</div>
    <div class="row"><span class="pill ${E.turnstile ? 'ok' : 'off'}">${E.turnstile ? 'Activo' : 'Sin configurar'}</span>Verificación anti-robots en formularios (además del filtro básico, siempre activo)</div>
    <div class="row"><span class="pill ${E.subidas ? 'ok' : 'warn'}">${E.subidas ? 'Activo' : 'Falta conectar'}</span>Almacenamiento de fotos</div>
  </div></div>`);
  $('#logoFile').onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    cargando(true);
    try { const url = await subirImagen(file, 'logo'); const j = await api('PATCH', '/api/panel/config', { logo: url }); S.config = j.config; toast('Logo actualizado en la web y en el panel.'); renderBrand(); VIEWS.config(); refrescarActividad(); }
    catch (err) { toast(err.message); } finally { cargando(false); }
  };
  $('#logoDel')?.addEventListener('click', () => accion($('#logoDel'), async () => { const j = await api('PATCH', '/api/panel/config', { logo: '' }); S.config = j.config; toast('Logo quitado.'); renderBrand(); VIEWS.config(); }));
  $('#dfFile').onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    cargando(true);
    try { const url = await subirImagen(file, 'qr'); if (await guardarConfig(null, c => { c.dataFiscal.imagen = url; }, 'QR de Data Fiscal actualizado.')) VIEWS.config(); }
    catch (err) { toast(err.message); } finally { cargando(false); }
  };
  $('#gForm').onsubmit = e => { e.preventDefault(); metricasCache = {}; guardarConfig(e.submitter, c => { c.google = { medicion: $('#g-med').value.trim().toUpperCase(), propiedad: $('#g-prop').value.trim(), sitioSearchConsole: $('#g-sc').value.trim() }; }, 'Google guardado.').then(ok => ok && VIEWS.config()); };
  $('#cfgForm').onsubmit = e => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#a-email').value.trim())) { toast('Revisá el email de contacto.'); return; }
    if ($('#a-whatsapp').value.replace(/\D/g, '').length < 10) { toast('El WhatsApp necesita código de país y área, por ejemplo 5493541000000.'); return; }
    const lat = Number($('#a-lat').value.replace(',', '.')), lng = Number($('#a-lng').value.replace(',', '.'));
    if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) { toast('Revisá la latitud y longitud (las sacás de Google Maps).'); return; }
    guardarConfig(e.submitter, c => {
      Object.keys(c.agencia).forEach(k => { const i = $('#a-' + k); if (i) c.agencia[k] = i.value.trim(); });
      c.agencia.lat = lat; c.agencia.lng = lng; c.agencia.whatsapp = c.agencia.whatsapp.replace(/\D/g, '');
      c.cotizacion = parseNum($('#a-fx').value); c.dataFiscal.enlace = $('#df-url').value.trim();
    }, 'Configuración guardada. En menos de un minuto se ve en la web.');
  };
};

/* ---------- usuarios ---------- */
function mostrarEnlace(titulo, texto, enlace) {
  const dl = $('#confirm');
  dl.innerHTML = `<div class="dlg-h"><h2 id="cf-t">${esc(titulo)}</h2></div><div class="dlg-b"><p style="margin:0">${esc(texto)}</p><label class="f" for="lnk">Enlace (vence en 72 h, sirve una sola vez)<input class="in" id="lnk" value="${esc(enlace)}" readonly></label><div class="row" style="justify-content:flex-end"><button class="btn" id="lnkCopy">Copiar enlace</button><a class="btn" id="lnkWa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent('Te paso el enlace para crear tu contraseña del panel: ' + enlace)}">Enviar por WhatsApp</a><button class="btn pri" id="lnkOk">Listo</button></div></div>`;
  dl.showModal(); $('#lnk').select();
  $('#lnkCopy').onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(enlace) : Promise.reject()).then(() => toast('Enlace copiado.'), () => { $('#lnk').select(); toast('Copialo con Ctrl+C.'); }); };
  $('#lnkOk').onclick = () => dl.close();
}
VIEWS.usuarios = () => {
  V(`<div class="card"><div class="card-h"><div><h2>Equipo</h2><span class="sub">Quién puede entrar al panel y qué puede hacer</span></div><button class="btn pri" id="invite">+ Invitar persona</button></div>
  <div class="tbl-wrap"><table><thead><tr><th>Nombre</th><th>Rol</th><th>Puede</th><th>Último ingreso</th><th></th></tr></thead><tbody>${S.usuarios.map(u => { const yo = u.id === S.yo.id; return `<tr data-u="${esc(u.id)}"><td><b>${esc(u.nombre)}</b><br><small class="muted">${esc(u.email)}</small></td><td><label class="sr-only" for="rol-${esc(u.id)}">Rol de ${esc(u.nombre)}</label><select class="in" id="rol-${esc(u.id)}" data-rol style="width:auto" ${yo ? 'disabled' : ''}>${Object.entries(S.roles).map(([k, r]) => `<option value="${k}" ${u.rol === k ? 'selected' : ''}>${r.nombre}</option>`).join('')}</select></td><td class="muted">${esc(S.roles[u.rol]?.puede || '')}</td><td>${u.pendiente ? '<span class="pill warn">Invitación pendiente</span>' : rel(u.ultimoIngreso)}</td><td><div class="row" style="flex-wrap:nowrap">${yo ? '<span class="pill info">Vos</span>' : `<button class="btn sm" data-link>${u.pendiente ? 'Nuevo enlace' : 'Restablecer contraseña'}</button><button class="btn sm danger" data-rmu>Quitar</button>`}</div></td></tr>`; }).join('')}</tbody></table></div></div>
  <p class="muted" style="font-size:.9rem;margin:0">Cada persona entra con su propio email y contraseña. Todo lo que hacen queda en la actividad del equipo.</p>`);
  $('#invite').onclick = () => {
    const dl = $('#confirm');
    dl.innerHTML = `<div class="dlg-h"><h2 id="cf-t">Invitar persona</h2></div><form class="dlg-b" id="invForm" novalidate><label class="f" for="inv-n">Nombre<input class="in" id="inv-n" maxlength="80"></label><label class="f" for="inv-e">Email<input class="in" id="inv-e" type="email" maxlength="160"></label><label class="f" for="inv-r">Rol<select class="in" id="inv-r">${Object.entries(S.roles).map(([k, r]) => `<option value="${k}" ${k === 'edicion' ? 'selected' : ''}>${r.nombre} · ${r.puede}</option>`).join('')}</select></label><p class="help">${S.entorno.email ? 'Le llega un email' : 'Te damos un enlace para mandarle'} para crear su contraseña (8 caracteres, una mayúscula, un número y un símbolo).</p><div class="row" style="justify-content:flex-end"><button class="btn" type="button" id="invNo">Cancelar</button><button class="btn pri" type="submit">Invitar</button></div></form>`;
    dl.showModal(); $('#invNo').onclick = () => dl.close();
    $('#invForm').onsubmit = e => {
      e.preventDefault(); const n = $('#inv-n').value.trim(), m = $('#inv-e').value.trim();
      if (!n || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)) { toast('Completá nombre y un email válido.'); return; }
      accion(e.submitter, async () => {
        const j = await api('POST', '/api/panel/usuarios', { nombre: n, email: m, rol: $('#inv-r').value });
        S.usuarios.push(j.usuario); dl.close(); VIEWS.usuarios(); refrescarActividad();
        mostrarEnlace('Invitación creada', j.enviado ? `Le mandamos un email a ${m}. Si no le llega, pasale este enlace:` : `Mandale este enlace a ${n} para que cree su contraseña:`, j.enlace);
      });
    };
  };
};
$('#view').addEventListener('change', async e => {
  if (!e.target.matches('[data-rol]')) return;
  const id = e.target.closest('[data-u]').dataset.u, u = S.usuarios.find(x => x.id === id), antes = u.rol;
  try { await api('PATCH', `/api/panel/usuarios/${id}`, { rol: e.target.value }); u.rol = e.target.value; toast('Rol actualizado.'); refrescarActividad(); }
  catch (err) { toast(err.message); u.rol = antes; }
  VIEWS.usuarios();
});
$('#view').addEventListener('click', e => {
  const tr = e.target.closest('[data-u]'); if (!tr) return;
  const u = S.usuarios.find(x => x.id === tr.dataset.u);
  if (e.target.closest('[data-rmu]')) ask(`¿Quitar a ${u.nombre}?`, 'No va a poder entrar más al panel.', 'Quitar', () => accion(null, async () => { await api('DELETE', `/api/panel/usuarios/${u.id}`); S.usuarios = S.usuarios.filter(x => x.id !== u.id); toast('Acceso quitado.'); VIEWS.usuarios(); refrescarActividad(); }));
  if (e.target.closest('[data-link]')) accion(e.target.closest('[data-link]'), async () => { const j = await api('POST', `/api/panel/usuarios/${u.id}/enlace`, {}); mostrarEnlace(u.pendiente ? 'Nuevo enlace de invitación' : 'Restablecer contraseña', `Mandale este enlace a ${u.nombre} para que cree ${u.pendiente ? 'su' : 'una nueva'} contraseña:`, j.enlace); refrescarActividad(); });
});

/* ---------- mi contraseña ---------- */
$('#miClave').onclick = () => {
  const dl = $('#confirm');
  dl.innerHTML = `<div class="dlg-h"><h2 id="cf-t">Cambiar mi contraseña</h2></div><form class="dlg-b" id="mcForm" novalidate>
    <label class="f" for="mc-a">Contraseña actual<input class="in" id="mc-a" type="password" autocomplete="current-password" maxlength="200"></label>
    <label class="f" for="mc-n">Contraseña nueva<input class="in" id="mc-n" type="password" autocomplete="new-password" maxlength="200"></label>
    <ul class="rules" id="rules3">${[['len', '8 caracteres o más'], ['up', 'Una mayúscula'], ['num', 'Un número'], ['sym', 'Un símbolo (!@#$…)']].map(([k, t]) => `<li data-r="${k}">${t}</li>`).join('')}</ul>
    <label class="f" for="mc-r">Repetila<input class="in" id="mc-r" type="password" autocomplete="new-password" maxlength="200"></label>
    <p class="help" style="margin:0">Se cierran las sesiones abiertas en otros dispositivos.</p>
    <div class="row" style="justify-content:flex-end"><button class="btn" type="button" id="mcNo">Cancelar</button><button class="btn pri" type="submit">Cambiar contraseña</button></div></form>`;
  dl.showModal(); $('#mcNo').onclick = () => dl.close();
  $('#mc-n').addEventListener('input', () => checkRules('#mc-n', '#rules3'));
  $('#mcForm').onsubmit = e => {
    e.preventDefault(); const n = $('#mc-n').value;
    if (!passOk(n)) { toast('La contraseña nueva no cumple las reglas.'); return; }
    if (n !== $('#mc-r').value) { toast('Las dos contraseñas nuevas no coinciden.'); return; }
    accion(e.submitter, async () => { await api('POST', '/api/panel/mi-clave', { actual: $('#mc-a').value, nueva: n }); dl.close(); toast('Listo, tu contraseña cambió.'); refrescarActividad(); });
  };
};

/* ---------- arranque ---------- */
(async () => {
  const m = location.hash.match(/^#clave=([\w-]+)$/);
  if (m) { tokenClave = m[1]; history.replaceState(null, '', '/panel'); $('#login').hidden = false; formAcceso('#claveForm'); checkRules('#cl-pass', '#rules2'); return; }
  cargando(true);
  let yo = null;
  try { yo = (await api('GET', '/api/panel/yo')).usuario; } catch (e) { toast(e.message); }
  cargando(false);
  if (yo) entrar(); else mostrarLogin();
})();
})();
