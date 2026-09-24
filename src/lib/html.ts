/** HTML generado en el servidor: todo valor interpolado se escapa salvo que se marque con raw(). */
export class Crudo {
  constructor(readonly valor: string) {}
  toString() { return this.valor; }
}

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ESC[c]);
export const raw = (v: string) => new Crudo(v);

function valor(v: unknown): string {
  if (v instanceof Crudo) return v.valor;
  if (Array.isArray(v)) return v.map(valor).join('');
  if (v === null || v === undefined || v === false) return '';
  return esc(v);
}

export function html(partes: TemplateStringsArray, ...vals: unknown[]): Crudo {
  let s = partes[0];
  for (let i = 0; i < vals.length; i++) s += valor(vals[i]) + partes[i + 1];
  return new Crudo(s);
}

/** JSON seguro para incrustar dentro de <script>. */
export const jsonSeguro = (v: unknown) => raw(JSON.stringify(v).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'));
