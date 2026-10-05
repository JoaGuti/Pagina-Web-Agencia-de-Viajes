import type { Money } from '@/lib/kuro';
import type { Sitio, Viaje } from '@/lib/sitio/modelo';

const nf = new Intl.NumberFormat('es-AR');
export const numero = (v: number) => nf.format(Math.round(v));
/** «USD 1.890». El importe y la moneda son de Kuro; la web solo los formatea. */
export const dinero = (m: Money) => `${m.currency} ${nf.format(Math.round(m.amount))}`;

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** "2026-11-14" → "14 nov" (agrega el año si no es el actual). */
export function fechaCorta(d: string) {
  const [y, m, dd] = d.split('-').map(Number);
  if (!y || !m || !dd) return d;
  return `${dd} ${MESES[m - 1]}${y !== new Date().getFullYear() ? ' ' + String(y).slice(2) : ''}`;
}
/** "2026-11-14" → "14 de noviembre de 2026"; acepta también un instante (en la zona dada). */
export function fechaLarga(d: string | Date, zona = 'America/Argentina/Buenos_Aires') {
  if (typeof d === 'string') {
    const [y, m, dd] = d.split('-').map(Number);
    return `${dd} de ${MESES_LARGOS[m - 1]} de ${y}`;
  }
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d).map(x => [x.type, x.value]));
  return `${+p.day} de ${MESES_LARGOS[+p.month - 1]} de ${p.year}`;
}
export const mesAnio = (d: string) => { const [y, m] = d.split('-').map(Number); return `${MESES_LARGOS[m - 1]} ${y}`; };

/** Salidas que todavía se pueden consultar, ordenadas (AAAA-MM-DD). */
export const proximasSalidas = (v: Pick<Viaje, 'salidas'>) => v.salidas.filter(s => s.consultable).map(s => s.inicio);

/** Abreviatura VISUAL de tres letras para la estampilla y la tarjeta de embarque (no es un código IATA). */
export const abreviatura = (nombre: string) => nombre.normalize('NFD').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || '···';

export const REGIONES: Record<string, string> = {
  caribe: 'Caribe', brasil: 'Brasil', asia: 'Asia e Índico', oceania: 'Polinesia', sudamerica: 'Sudamérica',
  argentina: 'Argentina', europa: 'Europa', norteamerica: 'Norteamérica', africa: 'África', cruceros: 'Cruceros',
};

export const soloDigitos = (v: string) => v.replace(/\D/g, '');
export const telHref = (t: string) => 'tel:' + t.replace(/[^\d+]/g, '');
/** Enlace de WhatsApp con el mensaje armado, o null si la agencia no cargó su número en Kuro. */
export function whatsapp(sitio: Pick<Sitio, 'agencia'>, texto: string): string | null {
  const n = sitio.agencia.whatsapp;
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(texto)}` : null;
}

export const slugificar = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

const NUMEROS = ['Cero', 'Una', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve', 'Diez', 'Once', 'Doce'];
export const enPalabras = (n: number) => NUMEROS[n] || String(n);

/** URL propia de la ficha de un viaje. */
export const urlViaje = (v: Pick<Viaje, 'segmento'>) => `/paquetes/${encodeURIComponent(v.segmento)}`;

/** «3 noches» / «4 días»: lo que Kuro tenga, sin inventar el otro dato. */
export function duracion(v: Pick<Viaje, 'noches' | 'dias'>): string | null {
  if (v.noches != null && v.noches > 0) return `${v.noches} noches`;
  if (v.dias != null && v.dias > 0) return `${v.dias} días`;
  return null;
}
