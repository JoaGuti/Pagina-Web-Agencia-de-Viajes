/**
 * Errores de la capa Kuro. Ningún mensaje incluye cuerpos de respuesta del servidor, URLs con
 * parámetros ni credenciales: son seguros para registrar y, los marcados como públicos, para mostrar.
 */
export class KuroError extends Error {
  constructor(message: string, readonly tipo: 'config' | 'api' | 'contrato' | 'red') {
    super(message);
    this.name = 'KuroError';
  }
}

/** Falta o es inválida una variable de configuración (solo se nombra la variable, nunca su valor). */
export class KuroConfigError extends KuroError {
  constructor(message: string) {
    super(message, 'config');
  }
}

/** La API respondió un error público del contrato (`KUxxx`). */
export class KuroApiError extends KuroError {
  constructor(readonly status: number, readonly codigo: string, mensaje: string, readonly issues: { field: string; message: string }[] = []) {
    // Un error interno nunca reenvía el texto del servidor.
    super(status >= 500 || codigo === 'KU500' || codigo === 'KU502' ? `Kuro respondió un error interno (${codigo}).` : mensaje, 'api');
  }
  get noEncontrado() {
    return this.status === 404 || this.codigo === 'KU404';
  }
  get limiteDeFrecuencia() {
    return this.status === 429 || this.codigo === 'KU429';
  }
  get datosInvalidos() {
    return this.status === 422 || this.status === 400 || this.codigo === 'KU422' || this.codigo === 'KU400';
  }
}

/** La respuesta no cumple el contrato v1 (o la entrada del llamador es inválida). */
export class KuroContractError extends KuroError {
  constructor(message: string, readonly detalle?: unknown) {
    super(message, 'contrato');
  }
}

/** No hubo respuesta: timeout o red caída. */
export class KuroNetworkError extends KuroError {
  constructor(readonly causa: 'timeout' | 'red') {
    super(causa === 'timeout' ? 'Kuro no respondió a tiempo.' : 'No se pudo conectar con Kuro.', 'red');
  }
}

/** Resumen apto para logs del servidor: sin secretos ni cuerpos. */
export function resumenParaLog(e: unknown): string {
  if (e instanceof KuroApiError) return `kuro:api status=${e.status} codigo=${e.codigo}`;
  if (e instanceof KuroNetworkError) return `kuro:red causa=${e.causa}`;
  if (e instanceof KuroError) return `kuro:${e.tipo} ${e.message}`;
  return 'error no Kuro';
}
