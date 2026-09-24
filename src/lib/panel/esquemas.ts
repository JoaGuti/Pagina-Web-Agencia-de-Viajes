import { z } from 'zod';
import { REGIONES } from '../formato';

const t = (max: number) => z.string().trim().max(max, `Uno de los textos supera los ${max} caracteres.`);
const entero = (min: number, max: number) => z.coerce.number().int('Usá números enteros.').min(min).max(max);
const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Revisá las fechas de salida.');

/** Solo fotos del propio sitio o del almacenamiento de archivos. */
export const urlFoto = z.string().trim().max(500).refine(u =>
  /^\/(media|uploads)\/[\w./-]+$/.test(u) && !u.includes('..') || /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[\w./-]+$/i.test(u),
'Una de las fotos tiene una dirección no permitida.');

export const Paquete = z.object({
  nombre: t(80).min(4, 'El nombre necesita al menos 4 letras.'),
  slug: t(90).optional(),
  destino: t(60).default(''),
  pais: t(60).default(''),
  iata: t(3).regex(/^[A-Za-z]{0,3}$/, 'El código de aeropuerto son 3 letras.').transform(v => v.toUpperCase()).default(''),
  region: z.string().refine(r => r in REGIONES, 'Elegí una región de la lista.'),
  tipo: t(40).default('Playa'),
  etiqueta: t(24).default(''),
  etiquetaColor: z.enum(['rojo', 'amarillo', 'azul', 'verde', 'negro']).default('rojo'),
  resumen: t(200).default(''),
  descripcion: t(6000).default(''),
  estado: z.enum(['publicado', 'borrador', 'pausado']),
  destacado: z.boolean().default(false),
  moneda: z.enum(['USD', 'ARS']).default('USD'),
  precio: entero(0, 100_000_000),
  precioSingle: entero(0, 100_000_000).default(0),
  precioTriple: entero(0, 100_000_000).default(0),
  precioMenor: entero(0, 100_000_000).default(0),
  cuotas: entero(0, 48).default(0),
  sena: entero(0, 100).default(0),
  noches: entero(0, 365).default(7),
  cupos: entero(0, 9999).default(0),
  regimen: t(60).default(''),
  transporte: t(40).default('Aéreo'),
  salidaDesde: t(60).default('Córdoba'),
  salidas: z.array(fechaISO).max(120).default([]),
  hotel: t(120).default(''),
  estrellas: entero(0, 5).default(0),
  itinerario: z.array(z.object({ t: t(120), d: t(1500) })).max(90).default([]),
  incluye: z.array(t(160)).max(60).default([]),
  noIncluye: z.array(t(160)).max(60).default([]),
  fotos: z.array(urlFoto).max(20).default([]),
  coord: t(40).default(''),
  seoTitulo: t(90).default(''),
  seoDescripcion: t(220).default(''),
  orden: entero(0, 100000).optional(),
}).superRefine((p, ctx) => {
  if (p.estado === 'publicado' && p.precio <= 0) ctx.addIssue({ code: 'custom', message: 'Para publicar, poné un precio mayor a 0.', path: ['precio'] });
});

export const CambioRapidoPaquete = z.object({
  precio: entero(1, 100_000_000).optional(),
  destacado: z.boolean().optional(),
  estado: z.enum(['publicado', 'borrador', 'pausado']).optional(),
});

export const PreciosEnBloque = z.object({
  ids: z.array(z.string().uuid()).max(500).optional(),
  region: z.string().optional(),
  porcentaje: z.coerce.number().min(-90, 'El cambio va de −90 % a +300 %.').max(300, 'El cambio va de −90 % a +300 %.'),
  redondeo: z.union([z.literal(1), z.literal(10), z.literal(50), z.literal(100)]).default(1),
});

export const Oferta = z.object({
  paqueteId: z.string().uuid('Elegí el paquete de la oferta.'),
  titulo: t(80).min(3, 'Poné un título a la oferta.'),
  etiqueta: t(30).default('Oferta relámpago'),
  descuento: entero(0, 90).default(0),
  precioFinal: entero(0, 100_000_000).default(0),
  desde: z.coerce.date(),
  hasta: z.coerce.date(),
  activa: z.boolean().default(true),
  contador: z.boolean().default(true),
  cupos: entero(0, 9999).default(0),
  nota: t(140).default(''),
}).refine(o => o.hasta > o.desde, { message: 'La fecha de fin tiene que ser posterior a la de inicio.', path: ['hasta'] })
  .refine(o => o.descuento > 0 || o.precioFinal > 0, { message: 'Indicá un descuento o un precio final.', path: ['descuento'] });

export const Config = z.object({
  agencia: z.object({
    nombre: t(60).min(2, 'Poné el nombre de la agencia.'),
    razonSocial: t(120), direccion: t(120), ciudad: t(80), provincia: t(80), cp: t(12),
    telefono: t(40), whatsapp: t(20).refine(v => v.replace(/\D/g, '').length >= 10, 'El WhatsApp necesita código de país y área, por ejemplo 5493541000000.'),
    email: t(120).email('Revisá el email de contacto.'), horario: t(160), legajo: t(20), cuit: t(20),
    instagram: t(200).refine(v => !v || /^https:\/\//.test(v), 'El enlace de Instagram tiene que empezar con https://'),
    facebook: t(200).refine(v => !v || /^https:\/\//.test(v), 'El enlace de Facebook tiene que empezar con https://'),
    lat: z.coerce.number().min(-90).max(90), lng: z.coerce.number().min(-180).max(180),
  }),
  cotizacion: z.coerce.number().min(0).max(1_000_000),
  google: z.object({
    medicion: t(20).refine(v => !v || /^G-[A-Z0-9]{4,15}$/.test(v), 'El ID de medición de Analytics tiene el formato G-XXXXXXX.'),
    propiedad: t(20).refine(v => !v || /^\d{5,15}$/.test(v), 'El ID de propiedad de Analytics es solo números.'),
    sitioSearchConsole: t(200).refine(v => !v || /^(sc-domain:[\w.-]+|https?:\/\/\S+)$/.test(v), 'La propiedad de Search Console es sc-domain:tudominio.com o la dirección completa.'),
  }),
  resenas: z.object({
    puntaje: z.coerce.number().min(0).max(5),
    cantidad: entero(0, 1_000_000),
    perfil: t(300).refine(v => !v || /^https:\/\//.test(v), 'El enlace de Google tiene que empezar con https://'),
  }),
  dataFiscal: z.object({
    imagen: z.union([z.literal(''), urlFoto]),
    enlace: t(300).refine(v => !v || /^https?:\/\/[\w.-]*(afip|arca)\.gob\.ar\//.test(v), 'El enlace de Data Fiscal tiene que ser el que da ARCA (qr.afip.gob.ar).'),
  }),
});

export const Resena = z.object({
  autor: t(80).min(2, 'Poné el nombre de quien escribió la reseña.'),
  texto: t(1200).min(5, 'Pegá el texto de la reseña.'),
  estrellas: entero(1, 5).default(5),
  cuando: t(40).default(''),
  activa: z.boolean().default(true),
  orden: entero(0, 100000).default(0),
});

export const Invitacion = z.object({
  nombre: t(80).min(2, 'Completá el nombre.'),
  email: t(160).toLowerCase().email('Revisá el email.'),
  rol: z.enum(['administracion', 'edicion', 'ventas']),
});
