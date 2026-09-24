(() => {
'use strict';
/* ============ utilidades ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const nf = new Intl.NumberFormat('es-AR');
const money = (v, cur = 'USD') => `${cur} ${nf.format(Math.round(v))}`;
function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
const rgba = (h, a) => `rgba(${hex(h).join(',')},${a})`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ============ datos que manda el servidor ============ */
const DATA = (() => { try { return JSON.parse(document.getElementById('datos').textContent); } catch (e) { return {}; } })();
const MEDIA = { hero: { video: '/media/hero-playa', poster: '/media/hero-playa.jpg' } };

/* ============ pintor de escenas (ilustraciones de cada destino) ============ */
function vgrad(c, y0, y1, stops) { const g = c.createLinearGradient(0, y0, 0, y1); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); return g; }
function sun(c, x, y, r, col, glow = .55) {
  const g = c.createRadialGradient(x, y, r * .2, x, y, r * 7); g.addColorStop(0, rgba(col, glow)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.fillRect(x - r * 7, y - r * 7, r * 14, r * 14);
  c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
}
function cloud(c, x, y, s, col, a) {
  c.fillStyle = rgba(col, a); c.beginPath();
  [[0, 0, 1], [.9, -.35, .8], [1.8, 0, .9], [-.9, .1, .7], [2.6, .15, .6]].forEach(([dx, dy, r]) => { c.moveTo(x + dx * s + r * s, y + dy * s); c.arc(x + dx * s, y + dy * s, r * s, 0, TAU); });
  c.fill();
}
function palm(c, x, y, h, lean, t, ph, col, fronds = 9) {
  const sway = Math.sin(t * .9 + ph) * h * .025;
  const tx = x + lean * h + sway, ty = y - h, cx = x + lean * h * .15, cy = y - h * .55;
  const N = 18, w0 = h * .05, w1 = h * .02, L = [], R = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N, px = (1 - s) ** 2 * x + 2 * (1 - s) * s * cx + s * s * tx, py = (1 - s) ** 2 * y + 2 * (1 - s) * s * cy + s * s * ty;
    const dx = 2 * (1 - s) * (cx - x) + 2 * s * (tx - cx), dy = 2 * (1 - s) * (cy - y) + 2 * s * (ty - cy), l = Math.hypot(dx, dy) || 1;
    const wd = (w0 + (w1 - w0) * s) / 2 * (1 + .14 * Math.sin(i * 2.3));
    L.push([px - dy / l * wd, py + dx / l * wd]); R.push([px + dy / l * wd, py - dx / l * wd]);
  }
  c.fillStyle = col; c.beginPath(); c.moveTo(L[0][0], L[0][1]); L.forEach(p => c.lineTo(p[0], p[1])); R.reverse().forEach(p => c.lineTo(p[0], p[1])); c.closePath(); c.fill();
  c.strokeStyle = col; c.lineCap = 'round';
  for (let i = 0; i < fronds; i++) {
    const a = -Math.PI - .3 + (i / (fronds - 1)) * (Math.PI + .6) + Math.sin(t * 1.3 + ph + i * .7) * .07 + lean * .3;
    const len = h * (.36 + .07 * Math.sin(i * 3.7 + ph));
    const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * .55 + len * .5;
    const qx = tx + Math.cos(a) * len * .55, qy = ty + Math.sin(a) * len * .6 - len * .12;
    c.lineWidth = Math.max(1, h * .012); c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(qx, qy, ex, ey); c.stroke();
    c.lineWidth = Math.max(.8, h * .0065); c.beginPath();
    for (let j = 2; j <= 16; j++) {
      const s = j / 16, px = (1 - s) ** 2 * tx + 2 * (1 - s) * s * qx + s * s * ex, py = (1 - s) ** 2 * ty + 2 * (1 - s) * s * qy + s * s * ey;
      const dx = 2 * (1 - s) * (qx - tx) + 2 * s * (ex - qx), dy = 2 * (1 - s) * (qy - ty) + 2 * s * (ey - qy), l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
      const ll = len * .22 * Math.sin(Math.PI * s) + len * .03;
      for (const sd of [-1, 1]) { const nx = -uy * sd, ny = ux * sd; c.moveTo(px, py); c.lineTo(px + (nx * .75 + ux * .45) * ll, py + (ny * .75 + uy * .45) * ll + ll * .55); }
    }
    c.stroke();
  }
  c.fillStyle = col; c.beginPath(); for (let k = 0; k < 3; k++) { c.moveTo(tx + (k - 1) * h * .03 + h * .02, ty + h * .03); c.arc(tx + (k - 1) * h * .03, ty + h * .03, h * .02, 0, TAU); } c.fill();
}
function seaBase(c, w, h, hy, cols, sx, seed) {
  c.fillStyle = vgrad(c, hy, h, cols); c.fillRect(0, hy, w, h - hy);
  c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(0, hy - .5, w, 1);
  const r = rng(seed);
  c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1;
  for (let k = 0; k < 18; k++) { const v = k / 18, y = hy + v * v * (h - hy); c.beginPath(); for (let x = 0; x <= w; x += 8) c.lineTo(x, y + Math.sin(x * .04 + k * 1.7) * (0.5 + v * 3)); c.stroke(); }
  if (sx != null) { c.fillStyle = 'rgba(255,240,200,.75)'; for (let i = 0; i < 90; i++) { const v = r(), u = (r() + r() + r() - 1.5); const y = hy + v * v * (h - hy); c.globalAlpha = r() * .8; c.fillRect(sx + u * (8 + v * w * .18), y, 3 + v * 14, 1 + v); } c.globalAlpha = 1; }
}
function mount(c, pts, w, h, col) { c.fillStyle = col; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x * w, y * h) : c.moveTo(x * w, y * h)); c.closePath(); c.fill(); }
function peak(c, cx, base, hg, wd, col) { c.fillStyle = col; c.beginPath(); c.moveTo(cx - wd, base); c.bezierCurveTo(cx - wd * .7, base - hg * .5, cx - wd * .25, base - hg * .96, cx, base - hg); c.bezierCurveTo(cx + wd * .3, base - hg * .9, cx + wd * .75, base - hg * .45, cx + wd, base); c.closePath(); c.fill(); }

/* ============ cuenta regresiva de las ofertas ============ */
function tickCount() {
  $$('.pass[data-vence]').forEach(pass => {
    const s = Math.max(0, (new Date(pass.dataset.vence) - Date.now()) / 1000);
    const v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), Math.floor(s % 60)];
    $$('.count b', pass).forEach((b, i) => { const t = String(v[i]).padStart(2, '0'); if (b.textContent !== t) b.textContent = t; });
    if (s <= 0) pass.closest('article').remove();
  });
}

/* ============ HERO: video de la pareja (con ilustración de respaldo) ============ */
const Hero = (() => {
  if (!document.getElementById('heroStage')) return { frame() { } };
  const sec = $('#inicio'), stage = $('#heroStage'), cv = $('#scene'), c = cv.getContext('2d');
  let W = 0, H = 0, S = 0, p = 0, mx = 0, my = 0, tmx = 0, tmy = 0;
  const r = rng(7), g = () => (r() + r() + r() - 1.5) / 1.5;
  const glints = Array.from({ length: 460 }, () => ({ u: g(), v: r(), s: 1 + r() * 3, ph: r() * TAU, l: 4 + r() * 16 }));
  const birds = Array.from({ length: 7 }, () => ({ x: r(), y: .1 + r() * .22, s: .008 + r() * .01, ph: r() * TAU, z: .6 + r() * .8 }));
  const cl = Array.from({ length: 6 }, (_, i) => ({ x: r(), y: .08 + r() * .3, s: .004 + r() * .006, sz: .6 + r() * .9, far: i % 2 }));
  const isle = Array.from({ length: 60 }, (_, i) => Math.max(0, Math.sin(i * .21) * .5 + Math.sin(i * .07 + 1) * .7 + Math.sin(i * .5) * .12));
  let cloudImg = [];
  function mkClouds() {
    cloudImg = [0, 1].map(k => {
      const o = document.createElement('canvas'), w = 420, h = 160; o.width = w; o.height = h; const q = o.getContext('2d');
      const gr = q.createLinearGradient(0, 20, 0, 140); gr.addColorStop(0, k ? 'rgba(255,214,186,.9)' : 'rgba(255,190,170,.75)'); gr.addColorStop(1, k ? 'rgba(236,120,120,.75)' : 'rgba(170,80,120,.6)');
      q.fillStyle = gr; q.filter = 'blur(6px)'; const rr = rng(k + 3);
      q.beginPath(); for (let i = 0; i < 14; i++) { const x = 60 + rr() * 300, y = 70 + rr() * 40 - Math.sin((x - 60) / 300 * Math.PI) * 30, R = 18 + rr() * 34; q.moveTo(x + R, y); q.arc(x, y, R, 0, TAU); } q.fill();
      return o;
    });
  }
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.75); W = stage.clientWidth; H = stage.clientHeight; S = Math.min(H, W * .95);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!cloudImg.length) mkClouds();
  }
  function above(t, shift) {
    const hy = H * .64, par = k => mx * 22 * k;
    c.save(); c.translate(0, -shift);
    c.fillStyle = vgrad(c, -H * .2, hy, ['#141a45', '#3d2361', '#9b3b6e', '#e8646a', '#ffa25e', '#ffd88a']); c.fillRect(0, -H, W, hy + H + 1);
    // estrellas tenues arriba
    c.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 40; i++) { const x = (i * 97.3 % 1) * W, y = ((i * 57.1) % 1) * hy * .35; c.globalAlpha = .2 + .3 * Math.abs(Math.sin(t * .8 + i)); c.fillRect((x + i * 131) % W, y, 1.4, 1.4); } c.globalAlpha = 1;
    const sx = W * .6 + par(.25), sy = hy - S * .1 + my * 6, sr = S * .085;
    sun(c, sx, sy, sr, '#ffcf7e', .5);
    const sg = c.createRadialGradient(sx, sy - sr * .2, sr * .1, sx, sy, sr); sg.addColorStop(0, '#fff7dd'); sg.addColorStop(1, '#ffc46a'); c.fillStyle = sg; c.beginPath(); c.arc(sx, sy, sr, 0, TAU); c.fill();
    cl.forEach(k => { const img = cloudImg[k.far], w = 420 * k.sz * S / 800, h = 160 * k.sz * S / 800; const x = ((k.x + t * k.s * .1) % 1) * (W + w * 2) - w + par(k.far ? .3 : .45); c.globalAlpha = k.far ? .55 : .8; c.drawImage(img, x, k.y * hy, w, h); }); c.globalAlpha = 1;
    // mar
    c.fillStyle = vgrad(c, hy, H + shift, ['#f7a46c', '#d0667a', '#733f70', '#253b5f', '#10263f']); c.fillRect(0, hy, W, H + shift - hy + 2);
    c.fillStyle = rgba('#ffd9a0', .18); c.beginPath(); c.ellipse(sx, hy + (H - hy) * .45, S * .1, (H - hy) * .55, 0, 0, TAU); c.fill();
    c.lineWidth = 1;
    for (let k = 0; k < 34; k++) { const v = k / 34, y = hy + v * v * (H + shift - hy); c.strokeStyle = `rgba(255,215,180,${.05 + v * .08})`; c.beginPath(); for (let x = 0; x <= W; x += 14) c.lineTo(x, y + Math.sin(x * (.02 - v * .012) + t * (1 + v) + k) * (.4 + v * 5)); c.stroke(); }
    c.fillStyle = '#fff0c4';
    glints.forEach(q => { const a = Math.max(0, Math.sin(t * q.s + q.ph)); if (a < .3) return; const v = q.v, y = hy + v * v * (H - hy); c.globalAlpha = a ** 4 * .9; c.fillRect(sx + q.u * (10 + v * W * .16), y, q.l * (.3 + v * 1.4), .8 + v * 1.8); }); c.globalAlpha = 1;
    // islas lejanas
    c.fillStyle = 'rgba(112,50,92,.82)'; c.beginPath(); c.moveTo(-20 + par(.5), hy + 1);
    isle.forEach((v, i) => c.lineTo(par(.5) + W * .02 + i * W * .0075, hy - v * S * .028)); c.lineTo(par(.5) + W * .47, hy + 1); c.fill();
    // isla principal
    const ix = par(.8); c.fillStyle = '#2a1331'; c.beginPath(); c.moveTo(W * .6 + ix, hy + 2); c.bezierCurveTo(W * .66 + ix, hy - S * .05, W * .74 + ix, hy - S * .075, W * .84 + ix, hy - S * .07); c.quadraticCurveTo(W * .95 + ix, hy - S * .065, W * 1.05 + ix, hy - S * .02); c.lineTo(W * 1.05 + ix, hy + 2); c.fill();
    const rf = c.createLinearGradient(0, hy, 0, hy + S * .06); rf.addColorStop(0, 'rgba(42,19,49,.45)'); rf.addColorStop(1, 'rgba(42,19,49,0)'); c.fillStyle = rf; c.beginPath(); c.moveTo(W * .6 + ix, hy + 2); c.bezierCurveTo(W * .7 + ix, hy + S * .05, W * .9 + ix, hy + S * .06, W * 1.05 + ix, hy + S * .03); c.lineTo(W * 1.05 + ix, hy + 2); c.fill();
    palm(c, W * .73 + ix, hy - S * .06, S * .3, .22, t, 0, '#2a1331');
    palm(c, W * .83 + ix, hy - S * .068, S * .38, -.12, t, 2, '#2a1331', 10);
    palm(c, W * .93 + ix, hy - S * .055, S * .26, -.34, t, 4, '#2a1331');
    // aves
    c.strokeStyle = 'rgba(40,16,40,.75)'; c.lineWidth = 1.6; c.lineCap = 'round';
    birds.forEach(b => { const x = ((b.x + t * b.s) % 1.2 - .1) * W + par(.4), y = b.y * hy + Math.sin(t * .6 + b.ph) * 8, f = Math.sin(t * 7 * b.z + b.ph) * 5 * b.z, s = 9 * b.z * S / 800; c.beginPath(); c.moveTo(x - s, y - f * .6); c.quadraticCurveTo(x - s * .4, y - s * .3 - f * .2, x, y); c.quadraticCurveTo(x + s * .4, y - s * .3 - f * .2, x + s, y - f * .6); c.stroke(); });
    // palmera en primer plano
    palm(c, W * 1.02 + par(1.4), H + shift + 10, S * .95, -.42, t, 1.3, '#1a0a1f', 11);
    c.restore();
  }
  /* video real; si no carga, queda la ilustración del atardecer */
  const vHero = $('#heroVid');
  let real = false;
  const small = () => innerWidth < 900 || (navigator.connection && navigator.connection.saveData);
  (function setup(v, m) {
    const ok = () => { if (real) return; real = true; stage.classList.add('real'); v.play().catch(() => { }); };
    const img = new Image(); img.onload = () => { v.poster = m.poster; ok(); }; img.src = m.poster;
    if (reduced) return;
    v.addEventListener('loadeddata', ok, { once: true });
    const ext = v.canPlayType('video/mp4; codecs="avc1.640028"') ? '.mp4' : '.webm';
    v.src = m.video + (small() ? '-720' : '') + ext;
  })(vHero, MEDIA.hero);
  function frame(now) {
    const rect = sec.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= innerHeight) { if (!vHero.paused) vHero.pause(); return; }
    p = clamp(-rect.top / Math.max(1, H)); stage.style.setProperty('--p', p.toFixed(4));
    mx += (tmx - mx) * .05; my += (tmy - my) * .05;
    if (real) {
      vHero.style.transform = `translate3d(${(mx * -12).toFixed(1)}px,${(p * H * .3 + my * -8).toFixed(1)}px,0) scale(${(1.06 + p * .12).toFixed(4)})`;
      if (vHero.paused && !reduced && vHero.readyState > 1) vHero.play().catch(() => { });
      return;
    }
    above(reduced ? 3 : now / 1000, -p * H * .3);
  }
  addEventListener('pointermove', e => { tmx = e.clientX / innerWidth * 2 - 1; tmy = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  resize(); addEventListener('resize', resize);
  return { frame };
})();

/* ============ avión sobre el horizonte del hero ============ */
const EdgeFlight = (() => {
  if (!document.querySelector('.hero-edge')) return { frame() { } };
  const edge = $('.hero-edge'), path = $('#edgePath'), reveal = $('#edgeReveal'), pl = $('#edgePlane');
  const L = path.getTotalLength(), period = 13;
  function frame(now) {
    const b = edge.getBoundingClientRect(); if (b.bottom < 0 || b.top > innerHeight) return;
    const s = reduced ? .62 : (now / 1000 / period) % 1;
    const at = Math.min(L, s * L), pt = path.getPointAtLength(at), pt2 = path.getPointAtLength(Math.min(L, at + 4));
    const kx = b.width / 1440, ky = b.height / 120;
    const ang = Math.atan2((pt2.y - pt.y) * ky, (pt2.x - pt.x) * kx) * 180 / Math.PI;
    pl.style.transform = `translate(${(pt.x * kx).toFixed(1)}px,${(pt.y * ky).toFixed(1)}px) translate(-50%,-50%) rotate(${ang.toFixed(1)}deg)`;
    pl.style.opacity = s < .03 ? s / .03 : s > .97 ? (1 - s) / .03 : 1;
    reveal.style.strokeDasharray = `${at.toFixed(1)} ${L.toFixed(1)}`;
  }
  return { frame };
})();

/* ============ destinos: scroll horizontal fijado ============ */
const destSec = $('#destinos'), track = $('#destTrack'), bar = $('#destBar');
const hayDest = !!(destSec && track);
const pinMQ = matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)');
let destDist = 0;
function measureDest() {
  if (!hayDest) return;
  if (!pinMQ.matches) { destSec.style.height = ''; track.style.transform = ''; return; }
  destDist = Math.max(0, track.scrollWidth - innerWidth);
  destSec.style.height = (destDist + innerHeight) + 'px';
}
function destFrame() {
  if (!hayDest) return;
  if (!pinMQ.matches) return;
  const r = destSec.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
  const q = clamp(-r.top / Math.max(1, destDist));
  track.style.transform = `translate3d(${(-q * destDist).toFixed(1)}px,0,0)`; bar.style.transform = `scaleX(${q.toFixed(4)})`;
}
function tilt(e) {
  const card = e.target.closest('[data-tilt]'); if (!card || reduced) return;
  const b = card.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
  card.style.transform = `perspective(900px) rotateY(${(x - .5) * 10}deg) rotateX(${(.5 - y) * 10}deg)`;
  card.style.setProperty('--gx', x * 100 + '%'); card.style.setProperty('--gy', y * 100 + '%');
}
if (hayDest) {
track.addEventListener('pointermove', tilt);
track.addEventListener('pointerout', e => { const card = e.target.closest('[data-tilt]'); if (card && !card.contains(e.relatedTarget)) card.style.transform = ''; });
}

/* ============ ruta del proceso: une los círculos numerados ============ */
const routeDraw = $('#routeDraw'), routeGuide = $('#routePath'), plane = $('#plane'), route = $('#route'), routeSvg = route && $('svg.path', route);
let routeLen = 1;
function buildRoute() {
  if (!route) return;
  if (getComputedStyle(routeSvg).display === 'none') return;
  const W = route.clientWidth, steps = $('.steps', route);
  const pts = $$('.step-n', route).map(n => { const st = n.parentElement; return [steps.offsetLeft + st.offsetLeft + n.offsetLeft + n.offsetWidth / 2, steps.offsetTop + st.offsetTop + n.offsetTop + n.offsetHeight / 2]; });
  if (pts.length < 2) return;
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  pts.slice(1).forEach(([x, y], i) => { const [px, py] = pts[i], dx = x - px, a = i % 2 ? 22 : -34; d += ` C${(px + dx * .35).toFixed(1)} ${(py + a).toFixed(1)} ${(x - dx * .35).toFixed(1)} ${(y + a).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`; });
  const [lx, ly] = pts[pts.length - 1], tail = Math.min(W - 24, lx + (W - lx) * .7);
  if (tail > lx + 30) d += ` C${(lx + (tail - lx) * .4).toFixed(1)} ${(ly - 30).toFixed(1)} ${(tail - 20).toFixed(1)} ${(ly - 30).toFixed(1)} ${tail.toFixed(1)} ${(ly - 22).toFixed(1)}`;
  routeSvg.setAttribute('viewBox', `0 0 ${W} 120`); routeSvg.style.width = W + 'px';
  routeGuide.setAttribute('d', d); routeDraw.setAttribute('d', d);
  routeLen = routeDraw.getTotalLength(); routeDraw.style.strokeDasharray = routeLen;
  routeFrame(true);
}
function routeFrame(force) {
  if (!route) return;
  const r = route.getBoundingClientRect(); if (!force && (r.bottom < 0 || r.top > innerHeight)) return;
  const q = reduced ? 1 : smooth(innerHeight * .85, innerHeight * .25, r.top);
  routeDraw.style.strokeDashoffset = routeLen * (1 - q);
  const at = routeLen * q, pt = routeDraw.getPointAtLength(at), pt2 = routeDraw.getPointAtLength(Math.min(routeLen, at + 2));
  const ang = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180 / Math.PI;
  plane.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
}
buildRoute();

/* ============ mapa ilustrado de Villa Carlos Paz ============ */
const MapView = (() => {
  if (!document.getElementById('mapbox')) return { frame() { }, size() { } };
  const box = $('#mapbox'), cv = $('#mapCanvas'), c = cv.getContext('2d'); let W, H, on = false;
  function size() { const d = Math.min(devicePixelRatio || 1, 2); W = box.clientWidth; H = box.clientHeight; cv.width = W * d; cv.height = H * d; c.setTransform(d, 0, 0, d, 0, 0); }
  function draw(t) {
    c.fillStyle = '#fbfaf8'; c.fillRect(0, 0, W, H);
    // curvas de nivel de las sierras
    c.lineWidth = 1;
    for (let k = 0; k < 14; k++) { c.strokeStyle = `rgba(214,40,57,${.06 + k * .006})`; c.beginPath(); for (let a = 0; a <= TAU + .01; a += .08) { const R = (40 + k * 26) * (1 + .18 * Math.sin(a * 3 + k * .4) + .08 * Math.sin(a * 7)); const x = W * .12 + Math.cos(a) * R * 1.3, y = H * .2 + Math.sin(a) * R; a ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    // lago San Roque
    const lx = W * .72, ly = H * .22;
    c.fillStyle = '#e4edf4'; c.strokeStyle = '#9fb6c9'; c.lineWidth = 1.5; c.beginPath();
    for (let a = 0; a <= TAU + .01; a += .1) { const R = 1 + .25 * Math.sin(a * 2 + 1) + .15 * Math.sin(a * 5); const x = lx + Math.cos(a) * W * .2 * R, y = ly + Math.sin(a) * H * .13 * R; a ? c.lineTo(x, y) : c.moveTo(x, y); } c.fill(); c.stroke();
    c.strokeStyle = 'rgba(80,110,140,.35)'; c.lineWidth = 1; for (let i = 0; i < 4; i++) { c.beginPath(); for (let x = lx - W * .12; x < lx + W * .12; x += 6) c.lineTo(x, ly - 20 + i * 14 + Math.sin(x * .05 + t * 1.5 + i) * 2); c.stroke(); }
    c.fillStyle = '#4d6a86'; c.font = '600 11px "DM Mono", monospace'; c.fillText('LAGO SAN ROQUE', lx - 52, ly + 4);
    // trama urbana
    c.strokeStyle = 'rgba(28,34,48,.07)';
    for (let i = -8; i < 20; i++) { c.beginPath(); c.moveTo(i * 38, H * .38); c.lineTo(i * 38 + H * .3, H); c.stroke(); c.beginPath(); c.moveTo(0, H * .38 + i * 30); c.lineTo(W, H * .3 + i * 30); c.stroke(); }
    // avenidas
    c.strokeStyle = 'rgba(214,40,57,.55)'; c.lineWidth = 3; c.setLineDash([]); c.beginPath(); c.moveTo(-10, H * .7); c.bezierCurveTo(W * .3, H * .62, W * .5, H * .5, W * .62, H * .36); c.stroke();
    c.setLineDash([8, 7]); c.beginPath(); c.moveTo(W * .5, H * .52); c.bezierCurveTo(W * .7, H * .56, W * .85, H * .5, W + 10, H * .46); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#d62839'; c.font = '500 10px "DM Mono", monospace'; c.fillText('→ CÓRDOBA 36 KM', W - 118, H * .44);
    // pin
    const px = W * .46, py = H * .5, pulse = (t * .7) % 1;
    c.lineWidth = 2;
    c.strokeStyle = `rgba(214,40,57,${1 - pulse})`; c.beginPath(); c.arc(px, py, 10 + pulse * 40, 0, TAU); c.stroke();
    c.strokeStyle = `rgba(214,40,57,${1 - (pulse + .5) % 1})`; c.beginPath(); c.arc(px, py, 10 + ((pulse + .5) % 1) * 40, 0, TAU); c.stroke();
    c.fillStyle = '#d62839'; c.beginPath(); c.moveTo(px, py); c.bezierCurveTo(px - 16, py - 20, px - 14, py - 40, px, py - 40); c.bezierCurveTo(px + 14, py - 40, px + 16, py - 20, px, py); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(px, py - 27, 5.5, 0, TAU); c.fill();
  }
  new IntersectionObserver(es => es.forEach(e => on = e.isIntersecting)).observe(box);
  size(); addEventListener('resize', size);
  return { frame(now) { if (on) draw(reduced ? 0 : now / 1000); }, size };
})();

/* ============ dibujos de viaje (aviones, mapas, valijas…) ============ */
const Doodles = (() => {
  const KINDS = ['plane', 'suitcase', 'map', 'compass', 'passport', 'camera', 'globe', 'balloon', 'ticket', 'pin', 'palm', 'stamp', 'paperplane', 'sun', 'loop'];
  const secs = $$('[data-doodles]');
  function build() {
    const narrow = innerWidth < 700;
    secs.forEach((sec, si) => {
      sec.querySelector(':scope > .doodles')?.remove();
      const n = Math.round(+sec.dataset.doodles * (narrow ? .6 : 1)), r = rng(101 + si * 17), light = sec.classList.contains('foot');
      let h = '';
      for (let i = 0; i < n; i++) {
        const k = KINDS[(Math.floor(r() * KINDS.length) + i) % KINDS.length];
        const edgeSide = i % 2 ? 84 + r() * 12 : r() * 12;
        const left = r() < .7 ? edgeSide : 14 + r() * 70;
        const size = (narrow ? 38 : 52) + r() * (narrow ? 34 : 64);
        const o = light ? .2 + r() * .14 : .24 + r() * .2;
        h += `<span class="dd" style="left:${left.toFixed(1)}%;top:${((i + r() * .8) / n * 100).toFixed(1)}%;width:${size.toFixed(0)}px;height:${size.toFixed(0)}px;--r:${((r() - .5) * 44).toFixed(1)}deg;--o:${o.toFixed(2)};--sp:${((r() - .5) * .22).toFixed(3)};--d:${(6 + r() * 6).toFixed(1)}s;--dl:-${(r() * 6).toFixed(1)}s"><svg viewBox="0 0 64 64"><use href="#d-${k}"/></svg></span>`;
      }
      const layer = document.createElement('div'); layer.className = 'doodles'; layer.setAttribute('aria-hidden', 'true'); layer.innerHTML = h;
      sec.prepend(layer);
    });
  }
  function frame() {
    if (reduced) return;
    secs.forEach(sec => { const b = sec.getBoundingClientRect(); if (b.bottom < 0 || b.top > innerHeight) return; sec.style.setProperty('--sy', b.top.toFixed(0)); });
  }
  build();
  return { frame, build };
})();

/* ============ nav y menú ============ */
const nav = $('#nav'); let lastY = 0;
function navFrame() { const y = scrollY; nav.classList.toggle('solid', y > innerHeight * .6); nav.classList.toggle('hide', y > lastY + 4 && y > innerHeight * 1.2); if (y < lastY - 4) nav.classList.remove('hide'); lastY = y; }
const menu = $('#menu'), burger = $('#burger');
const setMenu = o => { menu.classList.toggle('open', o); menu.setAttribute('aria-hidden', !o); burger.setAttribute('aria-expanded', o); };
burger.onclick = () => setMenu(true); $('#menuClose').onclick = () => setMenu(false);
$$('#menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
$$('.btn').forEach(b => b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.setProperty('--mx', e.clientX - r.left + 'px'); b.style.setProperty('--my', e.clientY - r.top + 'px'); }));

/* ============ filtros y buscador ============ */
function setFilter(f) {
  const grid = $('#pkGrid'); if (!grid) return;
  $$('#filters button').forEach(b => b.setAttribute('aria-pressed', b.dataset.f === f));
  let n = 0; $$('.pcard', grid).forEach(c => { const ok = f === 'todos' || c.dataset.region === f; c.hidden = !ok; if (ok) n++; });
  const vacio = $('#pkVacio'); if (vacio) vacio.hidden = n > 0;
  if (window.gsap && !reduced) gsap.from('#pkGrid .pcard:not([hidden])', { opacity: 0, duration: .5, stagger: .05, clearProps: 'opacity' });
}
$('#filters')?.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setFilter(b.dataset.f); });
$('#finder')?.addEventListener('submit', e => { e.preventDefault(); setFilter($('#f-dest').value); goTo('#paquetes'); });
document.addEventListener('click', e => { const a = e.target.closest('[data-pick]'); if (a && $('#pkGrid')) setFilter(a.dataset.pick); });

/* ============ formularios (se envían al servidor) ============ */
const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 4200); };
const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
async function enviar(url, datos, boton) {
  if (boton) { boton.disabled = true; boton.dataset.txt ??= boton.textContent; boton.textContent = 'Enviando…'; }
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'No pudimos enviar el formulario. Probá de nuevo.');
    return j;
  } finally { if (boton) { boton.disabled = false; boton.textContent = boton.dataset.txt; } }
}
/* Anti-spam de Cloudflare (solo si está configurado) */
const turnstile = {};
if (DATA.turnstile) {
  window.onTurnstileLoad = () => $$('[data-turnstile]').forEach(el => { turnstile[el.dataset.turnstile] = window.turnstile.render(el, { sitekey: DATA.turnstile, size: 'flexible' }); });
  const sc = document.createElement('script'); sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit'; sc.async = true; document.head.appendChild(sc);
}
const tokenDe = k => (DATA.turnstile && window.turnstile && turnstile[k] !== undefined) ? window.turnstile.getResponse(turnstile[k]) : '';
const reiniciar = k => { if (DATA.turnstile && window.turnstile && turnstile[k] !== undefined) window.turnstile.reset(turnstile[k]); };

$('#contactForm')?.addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target; let ok = true;
  const set = (id, m) => { $(`.err[data-for="${id}"]`).textContent = m; if (m) ok = false; };
  set('c-nombre', f.nombre.value.trim().length < 3 ? 'Escribí tu nombre completo.' : '');
  set('c-tel', f.tel.value.replace(/\D/g, '').length < 8 ? 'Revisá el número: necesitamos al menos 8 dígitos.' : '');
  set('c-email', !emailOk(f.email.value.trim()) ? 'Revisá el email, parece incompleto.' : '');
  if (!$('#c-ok').checked) { toast('Para enviar la consulta, aceptá la política de privacidad.'); ok = false; }
  if (!ok) return;
  try {
    await enviar('/api/consultas', { nombre: f.nombre.value, telefono: f.tel.value, email: f.email.value, destino: f.destino.value, fechaViaje: f.fecha.value, mensaje: f.mensaje.value, web: f.web.value, token: tokenDe('contacto') }, f.querySelector('[type=submit]'));
    f.reset(); toast('¡Listo! Recibimos tu consulta. Te respondemos hoy mismo.');
  } catch (err) { toast(err.message); }
  reiniciar('contacto');
});
$('#clubForm')?.addEventListener('submit', async e => {
  e.preventDefault(); const v = $('#club-email').value.trim();
  if (!emailOk(v)) { toast('Revisá el email, parece incompleto.'); return; }
  try { await enviar('/api/suscripcion', { email: v, web: e.target.web?.value || '' }, e.target.querySelector('[type=submit]')); e.target.reset(); toast('¡Listo! Te sumaste. Vas a recibir las ofertas antes que nadie.'); }
  catch (err) { toast(err.message); }
});
$('#regretForm')?.addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target;
  if ([...f.querySelectorAll('input:not([name=web])')].some(i => !i.value.trim()) || !emailOk($('#r-email').value)) { toast('Completá todos los campos para enviar la solicitud.'); return; }
  try {
    const j = await enviar('/api/arrepentimiento', { nombre: f.nombre.value, dni: f.dni.value, email: f.email.value, reserva: f.reserva.value, web: f.web.value, token: tokenDe('arrepentimiento') }, f.querySelector('[type=submit]'));
    f.reset(); const box = $('#regretOk'); if (box) { box.hidden = false; $('#regretCode').textContent = j.codigo; box.scrollIntoView({ block: 'center' }); }
  } catch (err) { toast(err.message); }
  reiniciar('arrepentimiento');
});
$('#copyAddr')?.addEventListener('click', () => { const a = DATA.direccion || ''; (navigator.clipboard ? navigator.clipboard.writeText(a) : Promise.reject()).then(() => toast('Dirección copiada.'), () => toast(a)); });

/* ============ cookies y Google Analytics (solo con permiso) ============ */
const CK = 'cookies-consentimiento';
function cargarAnaliticas() {
  if (!DATA.ga || window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('js', new Date()); gtag('config', DATA.ga, { anonymize_ip: true });
  const sc = document.createElement('script'); sc.async = true; sc.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(DATA.ga); document.head.appendChild(sc);
}
const ck = $('#cookies'); let ckVal = null; try { ckVal = localStorage.getItem(CK); } catch (e) { }
if (ckVal === 'all') cargarAnaliticas();
if (!ckVal && ck) setTimeout(() => ck.hidden = false, 2200);
ck?.addEventListener('click', e => { const b = e.target.closest('[data-ck]'); if (!b) return; try { localStorage.setItem(CK, b.dataset.ck); } catch (err) { } ck.hidden = true; if (b.dataset.ck === 'all') cargarAnaliticas(); toast(b.dataset.ck === 'all' ? 'Gracias. Activamos las analíticas.' : 'Listo, solo usamos cookies esenciales.'); });
$('#ckReset')?.addEventListener('click', () => { try { localStorage.removeItem(CK); } catch (e) { } if (ck) ck.hidden = false; toast('Elegí de nuevo en el aviso de cookies.'); });

/* ============ contadores ============ */
new IntersectionObserver((es, io) => es.forEach(e => {
  if (!e.isIntersecting || reduced) return; io.unobserve(e.target);
  $$('[data-count]', e.target).forEach(b => { const to = +b.dataset.count, dec = +(b.dataset.dec || 0), t0 = performance.now(); const step = now => { const k = clamp((now - t0) / 1600), v = to * (1 - Math.pow(1 - k, 3)); b.textContent = dec ? v.toFixed(dec).replace('.', ',') : nf.format(Math.round(v)); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); });
}), { threshold: .4 }).observe($('#stats') || document.body);

/* ============ scroll suave + animaciones de entrada ============ */
let lenis = null;
if (window.Lenis && !reduced) { lenis = new Lenis({ lerp: .09, wheelMultiplier: 1 }); }
function goTo(sel, done) {
  const isForm = sel === '#contactForm', el = isForm ? $('.contact') : $(sel); if (!el) { if (sel.startsWith('#')) location.href = '/' + sel; return; }
  const offset = isForm ? -110 : 0;
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.4, onComplete: done });
  else { scrollTo({ top: el.getBoundingClientRect().top + scrollY + offset, behavior: reduced ? 'auto' : 'smooth' }); if (done) setTimeout(done, reduced ? 0 : 900); }
}
function quote() {
  const f = $('#contactForm'); if (!f) { location.href = '/#contacto'; return; }
  goTo('#contactForm', () => { f.classList.remove('flash'); void f.offsetWidth; f.classList.add('flash'); $('#c-nombre').focus({ preventScroll: true }); });
}
document.addEventListener('click', e => { const a = e.target.closest('a[href^="#"]'); if (!a || a.getAttribute('href').length < 2) return; e.preventDefault(); if (a.hasAttribute('data-quote')) quote(); else goTo(a.getAttribute('href')); });

function splitTitle() {
  const h = $('#heroTitle');
  const wrapWords = (el) => { el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${[...w].map(ch => `<span class="ch">${esc(ch)}</span>`).join('')}</span>`).join(' '); };
  if (!h) return;
  wrapWords($('.l1', h)); wrapWords($('.l2', h));
}
function intro() {
  const ld = $('#loader'), cnt = $('#loaderCount'); if (!ld) return; const t0 = performance.now();
  const count = now => { const k = clamp((now - t0) / 1400); cnt.textContent = String(Math.round(k * 100)).padStart(3, '0'); if (k < 1) requestAnimationFrame(count); else done(); };
  const done = () => {
    if (window.gsap) {
      const tl = gsap.timeline();
      tl.to(ld, { clipPath: 'inset(0 0 100% 0)', duration: .9, ease: 'power4.inOut', onComplete: () => ld.remove() })
        .from('#heroTitle .ch', { yPercent: 110, rotate: 8, duration: 1.1, ease: 'power4.out', stagger: .025 }, '-=.35')
        .from('.hero-copy .eyebrow, .hero-sub, .hero-cta', { y: 24, opacity: 0, duration: .8, stagger: .1, ease: 'power3.out' }, '-=.8')
        .from('.finder form', { y: 40, opacity: 0, duration: .9, ease: 'power3.out' }, '-=.6');
    } else { ld.remove(); }
  };
  if (reduced) { ld.remove(); return; }
  requestAnimationFrame(count);
}
function reveals() {
  if (!window.gsap || !window.ScrollTrigger || reduced) return;
  gsap.registerPlugin(ScrollTrigger);
  if (lenis) lenis.on('scroll', ScrollTrigger.update);
  $$('.sec-head, .dest-head, .club > *').forEach(el => gsap.from(el.children.length && !el.matches('.h2,.lede,.eyebrow,form') ? el.children : el, { y: 50, opacity: 0, duration: 1, ease: 'power3.out', stagger: .12, scrollTrigger: { trigger: el, start: 'top 85%' } }));
  gsap.from('#offer', { y: 80, rotate: -2, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '#offer', start: 'top 85%' } });
  ScrollTrigger.batch('#pkGrid .pcard', { start: 'top 90%', onEnter: els => gsap.from(els, { opacity: 0, duration: .8, stagger: .06, ease: 'power2.out', clearProps: 'opacity' }) });
  gsap.from('.feats li', { y: 30, opacity: 0, duration: .8, stagger: .1, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.feats', start: 'top 85%' } });
  gsap.from('.circles .c', { scale: .6, opacity: 0, duration: 1.2, stagger: .2, ease: 'back.out(1.4)', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.circles', start: 'top 80%' } });
  gsap.from('.step', { y: 40, opacity: 0, duration: .9, stagger: .15, ease: 'power3.out', scrollTrigger: { trigger: '.steps', start: 'top 80%' } });
  gsap.from('.faq details', { y: 20, opacity: 0, duration: .7, stagger: .08, scrollTrigger: { trigger: '.faq', start: 'top 80%' } });
  gsap.from('.contact > *', { y: 60, opacity: 0, duration: 1, stagger: .15, ease: 'power3.out', scrollTrigger: { trigger: '.contact', start: 'top 85%' } });
}

/* ============ bucle principal ============ */
function loop(now) {
  if (lenis) lenis.raf(now);
  Hero.frame(now); EdgeFlight.frame(now); destFrame(); routeFrame(); MapView.frame(now); Doodles.frame(); navFrame();
  requestAnimationFrame(loop);
}
let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { measureDest(); MapView.size(); Doodles.build(); buildRoute(); }, 150); });
setInterval(tickCount, 1000);

splitTitle(); intro(); reveals(); measureDest(); tickCount();
if (document.fonts) document.fonts.ready.then(() => { measureDest(); buildRoute(); });
if (location.hash && location.hash.length > 1 && $(location.hash)) setTimeout(() => goTo(location.hash), 600);
requestAnimationFrame(loop);
})();
