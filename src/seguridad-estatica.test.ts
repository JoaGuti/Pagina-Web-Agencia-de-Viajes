import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Escaneo estático: el código que se ejecuta (servidor, navegador, configuración y manifiestos) no puede
 * contener rastros de la arquitectura anterior (Supabase/PostgREST directo, RPC SQL, almacenamiento
 * interno, claves privilegiadas). Los tests y fixtures y la documentación quedan fuera: ahí se nombran
 * justamente para comprobar que se rechazan.
 */
const RAIZ = join(__dirname, '..');
const PROHIBIDO = [
  'KURO_ANON_KEY', 'KURO_API_URL', 'KURO_SITE_HOST', '/rest/v1/rpc', 'site_catalog', 'resolve_site', 'submit_inquiry',
  'storage/v1/object', 'media-private', 'service_role', 'DATABASE_URL', 'drizzle', 'pglite',
];

function archivos(dir: string, salida: string[] = []) {
  for (const n of readdirSync(dir)) {
    if (['node_modules', '.next', '.git', 'bocetos', 'herramientas'].includes(n)) continue;
    const ruta = join(dir, n);
    if (statSync(ruta).isDirectory()) archivos(ruta, salida);
    else salida.push(ruta);
  }
  return salida;
}

const esRuntime = (f: string) => {
  const r = relative(RAIZ, f).replace(/\\/g, '/');
  if (/\.test\.ts$/.test(r) || r.includes('__fixtures__')) return false;
  return /^src\//.test(r) || /^public\/assets\/.*\.js$/.test(r) || /^next\.config\./.test(r) || r === 'package.json' || r === '.env.example';
};

describe('arquitectura anterior: 0 ocurrencias en el runtime', () => {
  const runtime = archivos(RAIZ).filter(esRuntime);
  it('hay código que revisar', () => expect(runtime.length).toBeGreaterThan(20));
  for (const termino of PROHIBIDO) {
    it(`no aparece «${termino}»`, () => {
      const donde = runtime.filter(f => readFileSync(f, 'utf8').toLowerCase().includes(termino.toLowerCase())).map(f => relative(RAIZ, f));
      expect(donde).toEqual([]);
    });
  }

  it('no queda panel propio, base local ni rutas administrativas', () => {
    const rutas = archivos(RAIZ).map(f => relative(RAIZ, f).replace(/\\/g, '/'));
    expect(rutas.filter(r => /^(src\/app\/panel|src\/app\/api\/panel|src\/lib\/db|drizzle|public\/assets\/panel)/.test(r) || r === 'drizzle.config.ts')).toEqual([]);
  });

  it('las únicas variables de Kuro son KURO_CONTENT_API_URL y KURO_SITE_KEY', () => {
    const usadas = new Set<string>();
    for (const f of runtime) for (const m of readFileSync(f, 'utf8').matchAll(/\bKURO_[A-Z_]+\b/g)) usadas.add(m[0]);
    expect([...usadas].sort()).toEqual(['KURO_CONTENT_API_URL', 'KURO_SITE_KEY']);
  });
});
