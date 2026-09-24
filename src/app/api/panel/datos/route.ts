import { asc, desc } from 'drizzle-orm';
import { puede, ROLES, usuarioPublico } from '@/lib/auth';
import { actividad, arrepentimientos, consultas, ofertas, paquetes, resenas, suscriptores, usuarios } from '@/lib/db/schema';
import { leerConfig } from '@/lib/datos';
import { REGIONES } from '@/lib/formato';
import { ruta } from '@/lib/panel/api';
import { cuentaServicio } from '@/lib/google';

export const dynamic = 'force-dynamic';

/** Todo lo que el panel necesita al abrir, según los permisos del usuario. */
export const GET = ruta(null, async ({ u, db }) => {
  const contenido = puede(u, 'contenido'), verConsultas = puede(u, 'consultas'), admin = puede(u, 'usuarios');
  const [cfg, pqs, ofs, cons, arr, subs, log, rs, equipo] = await Promise.all([
    leerConfig(),
    contenido || verConsultas ? db.select().from(paquetes).orderBy(asc(paquetes.orden), desc(paquetes.creado)) : [],
    contenido ? db.select().from(ofertas).orderBy(desc(ofertas.creado)) : [],
    verConsultas ? db.select().from(consultas).orderBy(desc(consultas.creado)).limit(500) : [],
    verConsultas ? db.select().from(arrepentimientos).orderBy(desc(arrepentimientos.creado)).limit(100) : [],
    verConsultas ? db.$count(suscriptores) : 0,
    db.select().from(actividad).orderBy(desc(actividad.creado)).limit(40),
    contenido ? db.select().from(resenas).orderBy(asc(resenas.orden), desc(resenas.creado)) : [],
    admin ? db.select().from(usuarios).orderBy(asc(usuarios.creado)) : [],
  ]);
  const sa = cuentaServicio();
  return {
    yo: usuarioPublico(u),
    config: cfg,
    paquetes: pqs,
    ofertas: ofs,
    consultas: cons,
    arrepentimientos: arr,
    suscriptores: subs,
    actividad: log,
    resenas: rs,
    usuarios: equipo.map(x => ({ id: x.id, nombre: x.nombre, email: x.email, rol: x.rol, activo: x.activo, ultimoIngreso: x.ultimoIngreso, pendiente: !x.hash, creado: x.creado })),
    roles: ROLES,
    regiones: REGIONES,
    entorno: {
      subidas: !!process.env.BLOB_READ_WRITE_TOKEN || !process.env.VERCEL,
      email: !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
      turnstile: !!(process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY),
      cuentaGoogle: sa?.client_email || '',
    },
  };
});
