import type { ConfigDatos, Paquete } from './tipos';

const nf = new Intl.NumberFormat('es-AR');
export const numero = (v: number) => nf.format(Math.round(v));
export const dinero = (v: number, moneda = 'USD') => `${moneda} ${nf.format(Math.round(v))}`;

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const anioActual = () => new Date().getFullYear();

/** "2026-11-14" → "14 nov" (agrega el año si no es el actual). */
export function fechaCorta(d: string) {
  const [y, m, dd] = d.split('-').map(Number);
  if (!y || !m || !dd) return d;
  return `${dd} ${MESES[m - 1]}${y !== anioActual() ? ' ' + String(y).slice(2) : ''}`;
}
export function fechaLarga(d: string | Date) {
  const f = typeof d === 'string' ? new Date(d + (d.length === 10 ? 'T12:00:00' : '')) : d;
  return `${f.getDate()} de ${MESES_LARGOS[f.getMonth()]} de ${f.getFullYear()}`;
}
export const mesAnio = (d: string) => { const [y, m] = d.split('-').map(Number); return `${MESES_LARGOS[m - 1]} ${y}`; };

/** Salidas futuras, ordenadas. */
export const proximasSalidas = (p: Pick<Paquete, 'salidas'>) => {
  const hoy = new Date().toISOString().slice(0, 10);
  return [...p.salidas].filter(s => s >= hoy).sort();
};

export const iata = (p: Pick<Paquete, 'iata' | 'destino'>) =>
  (p.iata || (p.destino || 'XXX').normalize('NFD').replace(/[^A-Za-z]/g, '').slice(0, 3)).toUpperCase();

export const ORIGEN_IATA: Record<string, string> = { 'Córdoba': 'COR', 'Buenos Aires': 'EZE', 'Rosario': 'ROS', 'Mendoza': 'MDZ', 'Tucumán': 'TUC', 'Salta': 'SLA', 'Neuquén': 'NQN' };

export const COLORES_ETIQUETA: Record<string, [string, string]> = {
  rojo: ['#d62839', '#fff'], amarillo: ['#ffc53d', '#1c2230'], azul: ['#1d3461', '#fff'], verde: ['#1c7c47', '#fff'], negro: ['#1c2230', '#fff'],
};

export const REGIONES: Record<string, string> = {
  caribe: 'Caribe', brasil: 'Brasil', asia: 'Asia e Índico', oceania: 'Polinesia', sudamerica: 'Sudamérica',
  argentina: 'Argentina', europa: 'Europa', norteamerica: 'Norteamérica', africa: 'África', cruceros: 'Cruceros',
};

/** Fotos: las propias del sitio y las subidas desde el panel tienen una versión de 800 px con sufijo -800. */
export function srcset(url: string) {
  if (!/\.(jpe?g|webp)$/i.test(url) || /-800\.(jpe?g|webp)$/i.test(url)) return '';
  if (!(url.startsWith('/media/fotos/') || url.startsWith('/uploads/') || /\.public\.blob\.vercel-storage\.com\/fotos\//.test(url))) return '';
  return `${url.replace(/\.(jpe?g|webp)$/i, '-800.$1')} 800w, ${url} 1600w`;
}

export const soloDigitos = (v: string) => v.replace(/\D/g, '');
export const whatsapp = (cfg: ConfigDatos, texto: string) => `https://wa.me/${soloDigitos(cfg.agencia.whatsapp)}?text=${encodeURIComponent(texto)}`;
const sinAcentos = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
/** Dirección con ciudad y provincia, sin repetirlas si ya vienen escritas en la dirección. */
export const direccionCompleta = (cfg: ConfigDatos) => {
  const { direccion, ciudad, provincia } = cfg.agencia;
  return [direccion, ...[ciudad, provincia].filter(x => x && !sinAcentos(direccion).includes(sinAcentos(x)))].filter(Boolean).join(', ');
};

function luminancia(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const escalar = (hex: string, k: number) => '#' + [1, 3, 5].map(i => Math.round(Math.min(255, parseInt(hex.slice(i, i + 2), 16) * k)).toString(16).padStart(2, '0')).join('');
const mezclarBlanco = (hex: string, k: number) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * k + 255 * (1 - k)).toString(16).padStart(2, '0')).join('');

/**
 * Variables de color de la plantilla para el color de marca elegido en Kuro.
 * Si es muy claro, se oscurece hasta que el texto blanco encima se lea bien.
 */
export function coloresMarca(color: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return '';
  let base = color.toLowerCase();
  for (let i = 0; i < 12 && luminancia(base) > 0.26; i++) base = escalar(base, 0.88);
  const oscuro = escalar(base, 0.77);
  return `:root{--red:${base};--coral:${base};--red-d:${oscuro};--coral-d:${oscuro};--reef:${oscuro};--red-soft:${mezclarBlanco(base, 0.07)}}`;
}
export const telHref = (t: string) => 'tel:' + t.replace(/[^\d+]/g, '');

export const slugificar = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

const NUMEROS = ['Cero', 'Una', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve', 'Diez', 'Once', 'Doce'];
export const enPalabras = (n: number) => NUMEROS[n] || String(n);

/** Precio final de un paquete con una oferta aplicada. */
export const precioConOferta = (precio: number, o: { precioFinal: number; descuento: number }) =>
  o.precioFinal > 0 ? o.precioFinal : Math.round(precio * (1 - (o.descuento || 0) / 100));
