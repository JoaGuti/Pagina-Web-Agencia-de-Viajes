import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import type { ConfigDatos } from './schema';

export const CONFIG_INICIAL: ConfigDatos = {
  agencia: {
    nombre: 'Arrecife Viajes', razonSocial: 'Arrecife Viajes S.R.L.', direccion: 'José Hernández 110', ciudad: 'Villa Carlos Paz',
    provincia: 'Córdoba', cp: 'X5152', telefono: '+54 3541 00-0000', whatsapp: '5493541000000', email: 'hola@arrecifeviajes.com.ar',
    horario: 'Lun a Vie 9 a 13 y 16 a 20 h · Sáb 9:30 a 13 h', legajo: '00000', cuit: '30-00000000-0',
    instagram: 'https://www.instagram.com/', facebook: 'https://www.facebook.com/', lat: -31.4241, lng: -64.4978,
  },
  logo: '',
  cotizacion: 1450,
  google: { medicion: '', propiedad: '', sitioSearchConsole: '' },
  resenas: { puntaje: 4.9, cantidad: 212, perfil: '' },
  dataFiscal: { imagen: '', enlace: '' },
};

const INCLUYE = ['Aéreo ida y vuelta', 'Traslados aeropuerto - hotel', 'Asistencia al viajero', 'Impuestos y tasas'];

type Nuevo = typeof schema.paquetes.$inferInsert;
const PAQUETES: Nuevo[] = [
  { slug: 'punta-cana-all-inclusive', nombre: 'Punta Cana all inclusive', destino: 'Punta Cana', pais: 'República Dominicana', iata: 'PUJ', region: 'caribe', tipo: 'Playa', noches: 7, precio: 1890, precioSingle: 2690, precioTriple: 1790, precioMenor: 990, cuotas: 12, sena: 20, regimen: 'All inclusive', hotel: 'Resort frente al mar en Bávaro', estrellas: 5, salidas: ['2026-11-14', '2026-12-05', '2027-01-16'], estado: 'publicado', destacado: true, etiqueta: 'Más vendido', etiquetaColor: 'amarillo', fotos: ['/media/fotos/puntacana.jpg'], coord: '18°34′N 68°24′O', cupos: 12, resumen: 'Resort frente al mar en Bávaro, traslados y asistencia al viajero incluidos.', descripcion: 'Siete noches frente al mar turquesa de Bávaro con todo incluido: comidas, bebidas, actividades y traslados. Vuelo directo desde Córdoba.', incluye: ['Aéreo ida y vuelta desde Córdoba', 'Traslados aeropuerto - hotel', '7 noches all inclusive', 'Asistencia al viajero'], noIncluye: ['Excursiones opcionales', 'Propinas'], itinerario: [{ t: 'Córdoba - Punta Cana', d: 'Vuelo directo y traslado al hotel.' }, { t: 'Días libres en la playa', d: 'All inclusive en el resort.' }, { t: 'Regreso', d: 'Traslado al aeropuerto y vuelo a Córdoba.' }], orden: 1 },
  { slug: 'maldivas-villa-sobre-el-agua', nombre: 'Maldivas, villa sobre el agua', destino: 'Maldivas', pais: 'Maldivas', iata: 'MLE', region: 'asia', tipo: 'Luna de miel', noches: 9, precio: 5490, cuotas: 6, regimen: 'Media pensión', salidaDesde: 'Buenos Aires', salidas: ['2026-11-20', '2027-02-11'], estado: 'publicado', destacado: true, etiqueta: 'Luna de miel', etiquetaColor: 'rojo', fotos: ['/media/fotos/maldivas.jpg'], coord: '3°12′N 73°13′E', cupos: 4, resumen: 'Hidroavión desde Malé y villa con escalera directa a la laguna.', incluye: INCLUYE, orden: 2 },
  { slug: 'bora-bora-y-tahiti', nombre: 'Bora Bora y Tahití', destino: 'Bora Bora', pais: 'Polinesia Francesa', iata: 'BOB', region: 'oceania', tipo: 'Luna de miel', noches: 10, precio: 6890, regimen: 'Desayuno', salidaDesde: 'Buenos Aires', salidas: ['2027-03-08'], estado: 'publicado', fotos: ['/media/fotos/borabora.jpg'], coord: '16°30′S 151°44′O', cupos: 6, resumen: 'Cuatro noches en Papeete y seis frente al monte Otemanu.', incluye: INCLUYE, orden: 3 },
  { slug: 'tulum-y-riviera-maya', nombre: 'Tulum y Riviera Maya', destino: 'Tulum', pais: 'México', iata: 'TQO', region: 'caribe', tipo: 'Playa', noches: 8, precio: 1690, cuotas: 12, regimen: 'All inclusive', salidas: ['2026-11-08', '2026-12-12', '2027-01-20'], estado: 'publicado', destacado: true, etiqueta: 'Oferta', etiquetaColor: 'rojo', fotos: ['/media/fotos/tulum.jpg'], coord: '20°13′N 87°28′O', cupos: 9, resumen: 'Ruinas mayas sobre el acantilado, cenotes y playas de arena blanca.', incluye: INCLUYE, orden: 4 },
  { slug: 'fernando-de-noronha', nombre: 'Fernando de Noronha', destino: 'Fernando de Noronha', pais: 'Brasil', iata: 'FEN', region: 'brasil', tipo: 'Aventura', noches: 6, precio: 2150, regimen: 'Desayuno', salidas: ['2026-11-02', '2027-01-09'], estado: 'publicado', etiqueta: 'Últimos lugares', etiquetaColor: 'rojo', fotos: ['/media/fotos/noronha.jpg'], coord: '3°51′S 32°25′O', cupos: 3, resumen: 'Pousada con vista al Morro Dois Irmãos y buceo con tortugas.', incluye: INCLUYE, orden: 5 },
  { slug: 'aruba-playa-eagle', nombre: 'Aruba, playa Eagle', destino: 'Aruba', pais: 'Aruba', iata: 'AUA', region: 'caribe', tipo: 'Playa', noches: 7, precio: 2290, regimen: 'All inclusive', salidas: ['2026-12-19', '2027-02-06'], estado: 'publicado', fotos: ['/media/fotos/aruba.jpg'], coord: '12°33′N 70°03′O', cupos: 10, resumen: 'Arena blanca, agua calma y el famoso árbol divi-divi torcido por el viento.', incluye: INCLUYE, orden: 6 },
  { slug: 'bali-templos-y-playas', nombre: 'Bali, templos y playas', destino: 'Bali', pais: 'Indonesia', iata: 'DPS', region: 'asia', tipo: 'Cultural', noches: 12, precio: 3190, regimen: 'Desayuno', salidaDesde: 'Buenos Aires', salidas: ['2027-04-10'], estado: 'publicado', fotos: ['/media/fotos/bali.jpg'], coord: '8°20′S 115°05′E', cupos: 7, resumen: 'Ubud, los arrozales de Tegallalang y atardeceres en Uluwatu.', incluye: INCLUYE, orden: 7 },
  { slug: 'morro-de-sao-paulo', nombre: 'Morro de São Paulo', destino: 'Morro de São Paulo', pais: 'Brasil', iata: 'SSA', region: 'brasil', tipo: 'Familias', noches: 7, precio: 1190, cuotas: 12, regimen: 'Desayuno', salidas: ['2026-12-27', '2027-01-23', '2027-02-13'], estado: 'publicado', etiqueta: 'Ideal familias', etiquetaColor: 'azul', fotos: ['/media/fotos/morro.jpg'], coord: '13°23′S 38°55′O', cupos: 14, resumen: 'Pueblo sin autos, piscinas naturales y el faro sobre el morro.', incluye: INCLUYE, orden: 8 },
];

const RESENAS = [
  ['Luciana Moyano', 'Nos resolvieron un vuelo cancelado a las 2 de la mañana en Punta Cana. Volvimos a casa sin perder un día. Súper recomendables.', 'hace 2 semanas'],
  ['Martín Aguirre', 'Nos armaron la luna de miel a Maldivas en dos días y el hotel nos esperaba con una cena en la playa. Atención impecable.', 'hace 1 mes'],
  ['Familia Ferreyra', 'Viajamos a Morro de São Paulo con tres chicos y nada falló. Los traslados siempre puntuales y el hotel tal cual las fotos.', 'hace 1 mes'],
  ['Silvina Rodríguez', 'Fuimos a Tulum con amigas. Nos recomendaron cenotes que no estaban en ninguna guía. Ya estamos planeando el próximo viaje.', 'hace 2 meses'],
  ['Diego Albornoz', 'Pagué en cuotas y me mandaron todo el itinerario por WhatsApp. Da gusto tener la oficina acá en Carlos Paz.', 'hace 3 meses'],
  ['Norma Quiroga', 'A nuestra edad teníamos miedo del viaje largo a Bali. Nos acompañaron en cada escala y respondieron todo al instante.', 'hace 4 meses'],
];

/** Crea la configuración la primera vez y, si SEED_DEMO no es "false", el contenido de demostración. */
export async function sembrar(db: PostgresJsDatabase<typeof schema>) {
  const insertada = await db.insert(schema.configuracion).values({ id: 1, datos: CONFIG_INICIAL }).onConflictDoNothing().returning({ id: schema.configuracion.id });
  if (!insertada.length || process.env.SEED_DEMO === 'false') return;
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.paquetes);
  if (n > 0) return;
  const creados = await db.insert(schema.paquetes).values(PAQUETES).returning({ id: schema.paquetes.id, slug: schema.paquetes.slug });
  const id = (slug: string) => creados.find(c => c.slug === slug)!.id;
  const dia = 864e5, ahora = Date.now();
  await db.insert(schema.ofertas).values([
    { paqueteId: id('tulum-y-riviera-maya'), titulo: 'Riviera Maya de último minuto', etiqueta: 'Oferta relámpago', descuento: 18, desde: new Date(ahora - dia), hasta: new Date(ahora + 10 * dia), nota: 'Cupos liberados por el hotel.' },
    { paqueteId: id('morro-de-sao-paulo'), titulo: 'Vacaciones de verano en Bahía', etiqueta: 'Preventa', descuento: 10, desde: new Date(ahora - dia), hasta: new Date(ahora + 20 * dia), contador: false },
  ]);
  await db.insert(schema.resenas).values(RESENAS.map(([autor, texto, cuando], i) => ({ autor, texto, cuando, estrellas: 5, orden: i })));
}
