/**
 * Textos del sitio. La agencia los edita en el panel Kuro (Configuración →
 * Mi web); lo que deja vacío usa estos textos por defecto (los mismos que
 * Kuro muestra de fondo en cada campo).
 */

export type Textos = {
  eyebrow: string;
  heroLinea1: string;
  heroLinea2: string;
  heroBajada: string;
  tituloSeo: string;
  descripcionSeo: string;
  porQueTitulo: [string, string];
  porQue: { icono: string; titulo: string; texto: string }[];
  pasosTitulo: [string, string];
  pasosBajada: string;
  pasos: { titulo: string; texto: string }[];
  cifras: { valor: number; texto: string }[];
  preguntas: { p: string; r: string }[];
  contactoTitulo: [string, string];
  contactoBajada: string;
  clubTitulo: [string, string];
  whatsapp: string;
};

export const POR_QUE = [
  { icono: 'compass', titulo: '18 años de experiencia', texto: 'Recorrimos cada destino antes de venderlo.' },
  { icono: 'ticket', titulo: 'Mejor precio asegurado', texto: 'Si lo encontrás más barato, lo igualamos.' },
  { icono: 'suitcase', titulo: 'Sin vueltas, todo armado', texto: 'Vuelos, hotel, traslados y seguro en un solo lugar.' },
  { icono: 'passport', titulo: 'Con vos durante el viaje', texto: 'Una línea directa las 24 h mientras estás afuera.' },
];

export const PASOS = [
  { titulo: 'Nos contás la idea', texto: 'Por WhatsApp, por teléfono o con un café en la oficina.' },
  { titulo: 'Presupuesto en 24 h', texto: 'Dos o tres opciones comparadas, con vuelos, hotel, traslados y seguro detallados.' },
  { titulo: 'Reservás en cuotas', texto: 'Tarjeta, transferencia o seña. Te mandamos los vouchers y un itinerario día por día.' },
  { titulo: 'Viajás acompañado', texto: 'Asistencia al viajero y una línea directa con nosotros las 24 h mientras estás afuera.' },
];

export const CIFRAS = [
  { valor: 18, texto: 'años armando viajes' },
  { valor: 12400, texto: 'viajeros atendidos' },
  { valor: 46, texto: 'destinos visitados por el equipo' },
];

export const PREGUNTAS = [
  { p: '¿Puedo viajar a Brasil solo con DNI?', r: 'Sí. Los argentinos ingresan a Brasil con el DNI tarjeta vigente. Si viajás con menores, te armamos la lista de documentación y autorizaciones que necesitás.' },
  { p: '¿Se puede pagar en cuotas?', r: 'Sí. Trabajamos con tarjetas de crédito bancarias en cuotas, transferencia y seña para congelar el precio. Cada paquete indica sus condiciones.' },
  { p: '¿Los precios están en dólares o en pesos?', r: 'Los paquetes internacionales se cotizan en dólares. Mostramos una referencia en pesos al tipo de cambio del día y la confirmamos al momento de reservar.' },
  { p: '¿Qué pasa si tengo que cancelar?', r: 'Depende de las condiciones de cada prestador. Antes de pagar te damos por escrito las penalidades. Si compraste a distancia, también tenés el botón de arrepentimiento al pie de la página.' },
  { p: '¿Incluyen asistencia al viajero?', r: 'Todos los paquetes internacionales incluyen asistencia médica. Podés ampliar la cobertura para deportes, embarazo o equipaje.' },
];

type Seccion = { eyebrow?: string; title1?: string; title2?: string; lede?: string };
/** Lo que la web usa de Mi web (sites.settings.web en Kuro; ver @kuro/core/siteweb). */
export type MiWeb = {
  hero?: { eyebrow?: string; l1?: string; l2?: string; sub?: string };
  porQue?: { title1?: string; title2?: string; items?: { icono?: string; titulo?: string; texto?: string }[] };
  pasos?: { title1?: string; title2?: string; lede?: string; items?: { titulo?: string; texto?: string }[] };
  preguntas?: { p?: string; r?: string }[];
  contacto?: Seccion;
  club?: { title1?: string; title2?: string };
  seo?: { title?: string; description?: string };
  whatsappMessage?: string;
  business?: { stats?: { value?: number; text?: string }[] };
};

const t = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const o = (a: string | undefined, b: string) => t(a) || b;
const par = (a: string | undefined, b: string | undefined, d: [string, string]): [string, string] => (t(a) || t(b) ? [t(a), t(b)] : d);
const ICONOS = new Set(['plane', 'suitcase', 'palm', 'compass', 'ticket', 'map', 'pin', 'camera', 'globe', 'passport', 'balloon', 'stamp', 'paperplane', 'sun']);

/** Textos finales: lo que cargó la agencia en Kuro y, donde dejó vacío, el texto por defecto. */
export function textosDe(w: MiWeb, lugar: { ciudad: string; provincia: string; direccion: string; horario: string }): Textos {
  const donde = [lugar.ciudad, lugar.provincia].filter(Boolean).join(', ');
  const porQue = (w.porQue?.items ?? []).filter(i => t(i.titulo)).map(i => ({ icono: ICONOS.has(t(i.icono)) ? t(i.icono) : 'plane', titulo: t(i.titulo), texto: t(i.texto) }));
  const pasos = (w.pasos?.items ?? []).filter(i => t(i.titulo)).map(i => ({ titulo: t(i.titulo), texto: t(i.texto) }));
  const preguntas = (w.preguntas ?? []).filter(q => t(q.p)).map(q => ({ p: t(q.p), r: t(q.r) }));
  const cifras = (w.business?.stats ?? []).filter(c => t(c.text)).map(c => ({ valor: Number(c.value) || 0, texto: t(c.text) }));
  const oficina = [lugar.direccion, lugar.ciudad].filter(Boolean).join(', ');
  const horario = lugar.horario ? ` Atendemos ${lugar.horario.replace('Lun a Vie', 'de lunes a viernes de').replace('Sáb', 'y los sábados de').replace(' · ', ' ')}.` : '';
  return {
    eyebrow: o(w.hero?.eyebrow, donde ? `Agencia de viajes · ${donde}` : 'Agencia de viajes'),
    heroLinea1: o(w.hero?.l1, 'El paraíso tiene'),
    heroLinea2: o(w.hero?.l2, 'fecha de salida.'),
    heroBajada: o(w.hero?.sub, 'Paquetes al Caribe, Brasil y las islas más lindas del mundo, con salida desde tu ciudad y alguien que te atiende de verdad.'),
    tituloSeo: o(w.seo?.title, donde ? `Agencia de viajes en ${donde}` : 'Agencia de viajes'),
    descripcionSeo: o(w.seo?.description, `Agencia de viajes${donde ? ` en ${donde}` : ''}. Paquetes al Caribe, Brasil, Maldivas y Polinesia, cuotas y atención personalizada.`),
    porQueTitulo: par(w.porQue?.title1, w.porQue?.title2, ['Estamos con vos,', 'así de simple.']),
    porQue: porQue.length ? porQue : POR_QUE,
    pasosTitulo: par(w.pasos?.title1, w.pasos?.title2, ['De la primera charla', 'al check-in.']),
    pasosBajada: o(w.pasos?.lede, 'Una sola persona te acompaña en todo el viaje. Si algo cambia, te avisamos antes que la aerolínea.'),
    pasos: pasos.length ? pasos : PASOS,
    cifras: cifras.length ? cifras : CIFRAS,
    preguntas: preguntas.length ? preguntas : [...PREGUNTAS, ...(oficina ? [{ p: '¿Dónde queda la agencia?', r: `En ${oficina}.${horario}` }] : [])],
    contactoTitulo: par(w.contacto?.title1, w.contacto?.title2, ['Vení a vernos', lugar.ciudad ? `a ${lugar.ciudad}.` : 'o escribinos.']),
    contactoBajada: o(w.contacto?.lede, 'Pasá por la oficina o dejanos tus datos y te llamamos nosotros.'),
    clubTitulo: par(w.club?.title1, w.club?.title2, ['Las ofertas de último minuto,', 'antes que nadie.']),
    whatsapp: o(w.whatsappMessage, 'Hola! Quiero hacer una consulta de viaje.'),
  };
}

export const FECHA_LEGALES = '24 de septiembre de 2026';
