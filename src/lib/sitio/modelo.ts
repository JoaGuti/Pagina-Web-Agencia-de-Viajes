import type { Money, Photo, PrecioDesde, UnidadTarifa } from '@/lib/kuro';

/**
 * Modelos de PRESENTACIÓN de esta web. Se arman desde el contrato de Kuro (ver `adaptador.ts`) y son
 * lo único que conocen las plantillas: ellas no saben cómo es la API.
 */
export type Agencia = {
  nombre: string;
  razonSocial: string | null;
  cuit: string | null;
  /** Etiqueta y número de habilitación tal como los carga la agencia en Kuro (p. ej. «Legajo EVyT N°» / «12345»). */
  habilitacionEtiqueta: string | null;
  habilitacion: string | null;
  /** Dirección completa como la carga la agencia. */
  direccion: string | null;
  email: string | null;
  telefono: string | null;
  /** Solo dígitos, listo para wa.me. */
  whatsapp: string | null;
};

export type Faq = { pregunta: string; respuesta: string };

export type Sitio = {
  clave: string;
  agencia: Agencia;
  logo: string | null;
  moneda: string;
  locale: string;
  zonaHoraria: string;
  /** Hoy (AAAA-MM-DD) en la zona horaria del sitio. */
  hoy: string;
  anuncio: { texto: string; enlace: string | null } | null;
  seo: { titulo: string | null; descripcion: string | null };
  faqs: Faq[];
  notasLegales: string | null;
  mensajeWhatsapp: string | null;
};

export type TarifaVista = {
  etiqueta: string;
  unidad: UnidadTarifa;
  precio: Money;
  desde: string;
  hasta: string;
  impuestosIncluidos: boolean;
  notaImpuestos: string | null;
};

export type SalidaVista = {
  id: string | null;
  inicio: string;
  fin: string;
  limiteConsulta: string | null;
  disponibilidad: 'a_confirmar' | 'disponible_informado' | 'agotado' | 'cerrado';
  /** Se puede consultar hoy (abierta, no vencida, dentro de su fecha límite). */
  consultable: boolean;
  tarifas: TarifaVista[];
};

export type Hotel = { nombre: string; ciudad: string | null; estrellas: number | null; noches: number | null; regimen: string | null };

export type Viaje = {
  /** Identidad estable en Kuro. */
  id: string;
  /** Segmento de URL propio de esta web: `<slug-bonito>-<publicId>`. No es identidad. */
  segmento: string;
  nombre: string;
  destino: string;
  destinos: string[];
  resumen: string;
  descripcion: string;
  region: string;
  modalidad: string;
  origen: string | null;
  noches: number | null;
  dias: number | null;
  fotos: Photo[];
  itinerario: { titulo: string; descripcion: string }[];
  /** Salidas desde hoy (incluye las agotadas o cerradas, marcadas como tales). */
  salidas: SalidaVista[];
  incluye: string[];
  noIncluye: string[];
  condiciones: string | null;
  etiqueta: string | null;
  destacado: boolean;
  publicado: Date;
  precioDesde: PrecioDesde | null;
  hoteles: Hotel[];
  regimen: string | null;
  opcionales: { nombre: string; precio: Money | null }[];
  deposito: number | null;
  cuotas: number | null;
  pago: string | null;
  requisitos: string | null;
  puntoEncuentro: string | null;
  grupo: string | null;
  consejos: string | null;
  contenido: {
    subtitulo: string | null;
    destacados: string[];
    fichas: { titulo: string; filas: { etiqueta: string; valor: string }[] }[];
    faqs: Faq[];
    insignias: string[];
    video: string | null;
    recorrido: string | null;
    documentos: { etiqueta: string; url: string }[];
    ctaTexto: string | null;
    ctaWhatsapp: string | null;
    seo: { titulo: string | null; descripcion: string | null };
  } | null;
};

export type OfertaVista = {
  titulo: string;
  tipo: string;
  etiqueta: string;
  destino: string | null;
  resumen: string | null;
  incluye: string[];
  fechasViaje: string | null;
  precio: Money | null;
  precioAnterior: Money | null;
  /** Descuento mostrado, solo si ambos precios están en la misma moneda y el anterior es mayor. */
  descuentoPct: number | null;
  nota: string | null;
  foto: string | null;
  vence: Date | null;
  contador: boolean;
  cupos: number | null;
  posicion: number;
  /** Paquete vinculado, enlazado exclusivamente por publicId. */
  viaje: Viaje | null;
};

export type DatosSitio = { sitio: Sitio; viajes: Viaje[]; ofertas: OfertaVista[] };
