/**
 * Reseñas EDITORIALES DE EJEMPLO, en código. Kuro todavía no tiene un módulo de testimonios;
 * si el producto lo necesita, puede sumarse más adelante y esta lista pasaría a venir de la Content API.
 *
 * Mientras `ejemplo` sea true no se muestra ningún puntaje agregado ni se emite `aggregateRating`
 * (no se publican calificaciones que no sean reales). Para usar reseñas reales: cargar las verdaderas,
 * poner `ejemplo: false` y completar `perfil`, `puntaje` y `cantidad` con los datos reales.
 */
export type Resena = { autor: string; texto: string; estrellas: number; cuando: string };

export const RESENAS = {
  ejemplo: true,
  perfil: '',
  puntaje: 0,
  cantidad: 0,
  items: [
    { autor: 'Luciana Moyano', texto: 'Nos resolvieron un vuelo cancelado a las 2 de la mañana en Punta Cana. Volvimos a casa sin perder un día. Súper recomendables.', estrellas: 5, cuando: 'hace 2 semanas' },
    { autor: 'Martín Aguirre', texto: 'Nos armaron la luna de miel a Maldivas en dos días y el hotel nos esperaba con una cena en la playa. Atención impecable.', estrellas: 5, cuando: 'hace 1 mes' },
    { autor: 'Familia Ferreyra', texto: 'Viajamos a Morro de São Paulo con tres chicos y nada falló. Los traslados siempre puntuales y el hotel tal cual las fotos.', estrellas: 5, cuando: 'hace 1 mes' },
    { autor: 'Silvina Rodríguez', texto: 'Fuimos a Tulum con amigas. Nos recomendaron cenotes que no estaban en ninguna guía. Ya estamos planeando el próximo viaje.', estrellas: 5, cuando: 'hace 2 meses' },
    { autor: 'Diego Albornoz', texto: 'Pagué en cuotas y me mandaron todo el itinerario por WhatsApp. Da gusto tener la oficina acá en Carlos Paz.', estrellas: 5, cuando: 'hace 3 meses' },
    { autor: 'Norma Quiroga', texto: 'A nuestra edad teníamos miedo del viaje largo a Bali. Nos acompañaron en cada escala y respondieron todo al instante.', estrellas: 5, cuando: 'hace 4 meses' },
  ] satisfies Resena[],
};
