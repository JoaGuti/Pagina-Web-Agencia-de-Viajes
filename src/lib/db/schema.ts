import { boolean, integer, jsonb, pgTable, serial, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';

const ts = (name: string) => timestamp(name, { withTimezone: true });

/** Datos generales editables desde Configuración (una sola fila, id = 1). */
export const configuracion = pgTable('configuracion', {
  id: integer('id').primaryKey(),
  datos: jsonb('datos').$type<ConfigDatos>().notNull(),
  actualizado: ts('actualizado').defaultNow().notNull(),
});

export type ConfigDatos = {
  agencia: {
    nombre: string; razonSocial: string; direccion: string; ciudad: string; provincia: string; cp: string;
    telefono: string; whatsapp: string; email: string; horario: string; legajo: string; cuit: string;
    instagram: string; facebook: string; lat: number; lng: number;
  };
  logo: string;
  cotizacion: number;
  google: { medicion: string; propiedad: string; sitioSearchConsole: string };
  resenas: { puntaje: number; cantidad: number; perfil: string };
  /** QR oficial de Data Fiscal (ARCA): imagen y enlace que entrega el organismo. */
  dataFiscal: { imagen: string; enlace: string };
};

export type ItinerarioDia = { t: string; d: string };

export const paquetes = pgTable('paquetes', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  nombre: text('nombre').notNull(),
  destino: text('destino').notNull().default(''),
  pais: text('pais').notNull().default(''),
  iata: text('iata').notNull().default(''),
  region: text('region').notNull().default('caribe'),
  tipo: text('tipo').notNull().default('Playa'),
  etiqueta: text('etiqueta').notNull().default(''),
  etiquetaColor: text('etiqueta_color').notNull().default('rojo'),
  resumen: text('resumen').notNull().default(''),
  descripcion: text('descripcion').notNull().default(''),
  estado: text('estado').notNull().default('borrador'),
  destacado: boolean('destacado').notNull().default(false),
  orden: integer('orden').notNull().default(0),
  moneda: text('moneda').notNull().default('USD'),
  precio: integer('precio').notNull().default(0),
  precioSingle: integer('precio_single').notNull().default(0),
  precioTriple: integer('precio_triple').notNull().default(0),
  precioMenor: integer('precio_menor').notNull().default(0),
  cuotas: integer('cuotas').notNull().default(0),
  sena: integer('sena').notNull().default(0),
  noches: integer('noches').notNull().default(7),
  cupos: integer('cupos').notNull().default(0),
  regimen: text('regimen').notNull().default(''),
  transporte: text('transporte').notNull().default('Aéreo'),
  salidaDesde: text('salida_desde').notNull().default('Córdoba'),
  salidas: jsonb('salidas').$type<string[]>().notNull().default([]),
  hotel: text('hotel').notNull().default(''),
  estrellas: integer('estrellas').notNull().default(0),
  itinerario: jsonb('itinerario').$type<ItinerarioDia[]>().notNull().default([]),
  incluye: jsonb('incluye').$type<string[]>().notNull().default([]),
  noIncluye: jsonb('no_incluye').$type<string[]>().notNull().default([]),
  fotos: jsonb('fotos').$type<string[]>().notNull().default([]),
  coord: text('coord').notNull().default(''),
  seoTitulo: text('seo_titulo').notNull().default(''),
  seoDescripcion: text('seo_descripcion').notNull().default(''),
  creado: ts('creado').defaultNow().notNull(),
  actualizado: ts('actualizado').defaultNow().notNull(),
}, t => [index('paquetes_estado_idx').on(t.estado)]);

export const ofertas = pgTable('ofertas', {
  id: uuid('id').primaryKey().defaultRandom(),
  paqueteId: uuid('paquete_id').notNull().references(() => paquetes.id, { onDelete: 'cascade' }),
  titulo: text('titulo').notNull(),
  etiqueta: text('etiqueta').notNull().default('Oferta relámpago'),
  descuento: integer('descuento').notNull().default(0),
  precioFinal: integer('precio_final').notNull().default(0),
  desde: ts('desde').notNull(),
  hasta: ts('hasta').notNull(),
  activa: boolean('activa').notNull().default(true),
  contador: boolean('contador').notNull().default(true),
  cupos: integer('cupos').notNull().default(0),
  nota: text('nota').notNull().default(''),
  creado: ts('creado').defaultNow().notNull(),
});

export const consultas = pgTable('consultas', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull(),
  telefono: text('telefono').notNull(),
  email: text('email').notNull(),
  destino: text('destino').notNull().default(''),
  fechaViaje: text('fecha_viaje').notNull().default(''),
  mensaje: text('mensaje').notNull().default(''),
  estado: text('estado').notNull().default('nueva'),
  creado: ts('creado').defaultNow().notNull(),
}, t => [index('consultas_creado_idx').on(t.creado)]);

export const usuarios = pgTable('usuarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull(),
  email: text('email').notNull().unique(),
  hash: text('hash'),
  rol: text('rol').notNull().default('edicion'),
  activo: boolean('activo').notNull().default(true),
  intentosFallidos: integer('intentos_fallidos').notNull().default(0),
  bloqueadoHasta: ts('bloqueado_hasta'),
  ultimoIngreso: ts('ultimo_ingreso'),
  invitacionHash: text('invitacion_hash'),
  invitacionVence: ts('invitacion_vence'),
  creado: ts('creado').defaultNow().notNull(),
});

export const sesiones = pgTable('sesiones', {
  id: text('id').primaryKey(),
  usuarioId: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  vence: ts('vence').notNull(),
  creado: ts('creado').defaultNow().notNull(),
});

export const actividad = pgTable('actividad', {
  id: serial('id').primaryKey(),
  usuarioId: uuid('usuario_id'),
  nombre: text('nombre').notNull(),
  accion: text('accion').notNull(),
  creado: ts('creado').defaultNow().notNull(),
});

export const resenas = pgTable('resenas', {
  id: uuid('id').primaryKey().defaultRandom(),
  autor: text('autor').notNull(),
  texto: text('texto').notNull(),
  estrellas: integer('estrellas').notNull().default(5),
  cuando: text('cuando').notNull().default(''),
  activa: boolean('activa').notNull().default(true),
  orden: integer('orden').notNull().default(0),
  creado: ts('creado').defaultNow().notNull(),
});

export const suscriptores = pgTable('suscriptores', {
  email: text('email').primaryKey(),
  creado: ts('creado').defaultNow().notNull(),
});

export const arrepentimientos = pgTable('arrepentimientos', {
  id: uuid('id').primaryKey().defaultRandom(),
  codigo: text('codigo').notNull().unique(),
  nombre: text('nombre').notNull(),
  dni: text('dni').notNull(),
  email: text('email').notNull(),
  reserva: text('reserva').notNull(),
  creado: ts('creado').defaultNow().notNull(),
});

/** Contadores para limitar envíos de formularios e intentos por IP. */
export const limites = pgTable('limites', {
  clave: text('clave').primaryKey(),
  cantidad: integer('cantidad').notNull().default(0),
  desde: ts('desde').defaultNow().notNull(),
});

export type Paquete = typeof paquetes.$inferSelect;
export type Oferta = typeof ofertas.$inferSelect;
export type Consulta = typeof consultas.$inferSelect;
export type Usuario = typeof usuarios.$inferSelect;
export type Resena = typeof resenas.$inferSelect;
