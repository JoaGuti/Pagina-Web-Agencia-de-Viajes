import type { ConfigDatos, Paquete } from './db/schema';

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
export const direccionCompleta = (cfg: ConfigDatos) => `${cfg.agencia.direccion}, ${cfg.agencia.ciudad}, ${cfg.agencia.provincia}`;
export const telHref = (t: string) => 'tel:' + t.replace(/[^\d+]/g, '');

export const slugificar = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

const NUMEROS = ['Cero', 'Una', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve', 'Diez', 'Once', 'Doce'];
export const enPalabras = (n: number) => NUMEROS[n] || String(n);

/** Precio final de un paquete con una oferta aplicada. */
export const precioConOferta = (precio: number, o: { precioFinal: number; descuento: number }) =>
  o.precioFinal > 0 ? o.precioFinal : Math.round(precio * (1 - (o.descuento || 0) / 100));
