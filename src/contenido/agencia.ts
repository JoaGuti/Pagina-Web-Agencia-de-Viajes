/**
 * Datos de ESTA web que Kuro todavía no administra (la presentación los necesita para el mapa, el
 * SEO local, las redes y el sello de Data Fiscal). Los cambia el desarrollador, no la agencia.
 * Todo lo demás de la agencia (nombre, contacto, logo, legales, FAQs, anuncio) viene del Site de Kuro.
 *
 * Los valores son de la agencia de ejemplo «Arrecife Viajes»: reemplazarlos al configurar otra agencia.
 * Pendiente (si el producto lo necesita): ubicación, horario y redes en el Site de Kuro.
 */
export const UBICACION = {
  ciudad: 'Villa Carlos Paz',
  provincia: 'Córdoba',
  cp: 'X5152',
  lat: -31.4241,
  lng: -64.4978,
  horario: 'Lun a Vie 9 a 13 y 16 a 20 h · Sáb 9:30 a 13 h',
  pais: 'AR',
};

export const REDES = {
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
};

/** QR oficial de Data Fiscal (ARCA): imagen y enlace que entrega el organismo. Vacío = no se muestra. */
export const DATA_FISCAL = { imagen: '', enlace: '' };
