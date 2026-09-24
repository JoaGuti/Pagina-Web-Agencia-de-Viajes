/** Textos fijos del sitio. Los cambia el desarrollador a pedido de la agencia. */
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
  { icono: 'ticket', titulo: 'Mejor precio asegurado', texto: 'Si lo encontrás más barato, lo igualamos.' },
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

export const PREGUNTAS = [
  { p: '¿Puedo viajar a Brasil solo con DNI?', r: 'Sí. Los argentinos ingresan a Brasil con el DNI tarjeta vigente. Si viajás con menores, te armamos la lista de documentación y autorizaciones que necesitás.' },
  { p: '¿Se puede pagar en cuotas?', r: 'Sí. Trabajamos con tarjetas de crédito bancarias en cuotas, transferencia y seña para congelar el precio. Cada paquete indica sus condiciones.' },
  { p: '¿Los precios están en dólares o en pesos?', r: 'Los paquetes internacionales se cotizan en dólares. Mostramos una referencia en pesos al tipo de cambio del día y la confirmamos al momento de reservar.' },
  { p: '¿Qué pasa si tengo que cancelar?', r: 'Depende de las condiciones de cada prestador. Antes de pagar te damos por escrito las penalidades. Si compraste a distancia, también tenés el botón de arrepentimiento al pie de la página.' },
  { p: '¿Incluyen asistencia al viajero?', r: 'Todos los paquetes internacionales incluyen asistencia médica. Podés ampliar la cobertura para deportes, embarazo o equipaje.' },
  { p: '¿Dónde queda la agencia?', r: (dir: string, horario: string) => `En ${dir}. Atendemos ${horario.replace('Lun a Vie', 'de lunes a viernes de').replace('Sáb', 'y los sábados de').replace(' · ', ' ')}.` },
];

export const respuesta = (q: (typeof PREGUNTAS)[number], dir: string, horario: string) => typeof q.r === 'function' ? q.r(dir, horario) : q.r;

export const FECHA_LEGALES = '24 de septiembre de 2026';
