import type { Textos } from '@/contenido/sitio';

/**
 * Formas de los datos que usan las plantillas. Todo sale del panel Kuro
 * (ver lib/kuro): esta web no tiene base ni panel propios.
 */

export type ItinerarioDia = { t: string; d: string };

/** Datos de la agencia: Kuro → Configuración (Organización y Mi web). */
export type ConfigDatos = {
  agencia: {
    nombre: string; razonSocial: string; direccion: string; ciudad: string; provincia: string; cp: string;
    telefono: string; whatsapp: string; email: string; horario: string; legajo: string; cuit: string;
    instagram: string; facebook: string; lat: number; lng: number;
  };
  logo: string;
  /** Color de la marca (#rrggbb) elegido en Kuro; vacío: el rojo de la plantilla. */
  color: string;
  cotizacion: number;
  google: { medicion: string };
  resenas: { puntaje: number; cantidad: number; perfil: string };
  /** QR oficial de Data Fiscal (ARCA): imagen y enlace que entrega el organismo. */
  dataFiscal: { imagen: string; enlace: string };
  /** Textos editables del sitio (Mi web) ya combinados con los de por defecto. */
  textos: Textos;
};

export type Paquete = {
  id: string; slug: string; nombre: string; destino: string; pais: string; iata: string; region: string; tipo: string;
  etiqueta: string; etiquetaColor: string; resumen: string; descripcion: string; estado: string; destacado: boolean; orden: number;
  moneda: string; precio: number; precioSingle: number; precioTriple: number; precioMenor: number; cuotas: number; sena: number;
  noches: number; cupos: number; regimen: string; transporte: string; salidaDesde: string; salidas: string[];
  hotel: string; estrellas: number; itinerario: ItinerarioDia[]; incluye: string[]; noIncluye: string[]; fotos: string[];
  coord: string; seoTitulo: string; seoDescripcion: string; creado: Date; actualizado: Date;
};

export type Oferta = {
  id: string; paqueteId: string; titulo: string; etiqueta: string; descuento: number; precioFinal: number;
  desde: Date; hasta: Date; activa: boolean; contador: boolean; cupos: number; nota: string; creado: Date;
};

export type Resena = { id: string; autor: string; texto: string; estrellas: number; cuando: string };
