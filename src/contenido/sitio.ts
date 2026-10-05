/**
 * Textos fijos de PRESENTACIÓN del sitio (copy decorativo). Los cambia el desarrollador.
 * Los datos que edita la agencia (contacto, FAQs, legales, anuncio, paquetes…) vienen de Kuro.
 */
export const TEXTOS = {
  eyebrowPortada: 'Agencia de viajes · Villa Carlos Paz, Córdoba',
  heroLinea1: 'El paraíso tiene',
  heroLinea2: 'fecha de salida.',
  heroBajada: 'Paquetes al Caribe, Brasil y las islas más lindas del mundo, con salida desde Córdoba y alguien que te atiende de verdad.',
  descripcionSeo: 'Agencia de viajes en Villa Carlos Paz, Córdoba. Paquetes al Caribe, Brasil, Maldivas y Polinesia con salida desde Córdoba, cuotas y atención personalizada.',
  tituloSeo: 'Agencia de viajes en Villa Carlos Paz, Córdoba',
  ogTitulo: 'El paraíso tiene fecha de salida',
  contactoTitulo: ['Vení a vernos', 'a Carlos Paz.'],
  contactoBajada: 'A dos cuadras de la costanera del lago San Roque. O escribinos y te llamamos nosotros.',
  mapaNota: 'Córdoba capital a 36 km',
  mapaAltura: '650 m s.n.m.',
};

export const POR_QUE = [
  { icono: 'compass', titulo: '18 años de experiencia', texto: 'Recorrimos cada destino antes de venderlo.' },
  { icono: 'ticket', titulo: 'Precios claros', texto: 'Cada paquete detalla tarifas, impuestos y condiciones.' },
  { icono: 'suitcase', titulo: 'Sin vueltas, todo armado', texto: 'Vuelos, hotel, traslados y seguro en un solo lugar.' },
  { icono: 'passport', titulo: 'Con vos durante el viaje', texto: 'Una línea directa las 24 h mientras estás afuera.' },
];

export const PASOS = [
  { titulo: 'Nos contás la idea', texto: (dir: string) => `Por WhatsApp, por teléfono o con un café en la oficina de ${dir}.` },
  { titulo: 'Presupuesto en 24 h', texto: () => 'Dos o tres opciones comparadas, con vuelos, hotel, traslados y seguro detallados.' },
  { titulo: 'Reservás en cuotas', texto: () => 'Tarjeta, transferencia o seña. Te mandamos los vouchers y un itinerario día por día.' },
  { titulo: 'Viajás acompañado', texto: () => 'Asistencia al viajero y una línea directa con nosotros las 24 h mientras estás afuera.' },
];

export const CIFRAS = [
  { valor: 18, texto: 'años armando viajes' },
  { valor: 12400, texto: 'viajeros de Córdoba' },
  { valor: 46, texto: 'destinos visitados por el equipo' },
];

export const FECHA_LEGALES = '24 de septiembre de 2026';
