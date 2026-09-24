// Descarga y optimiza los videos y fotos de los bocetos.
// Uso: cd herramientas && npm install && npm run medios
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import sharp from 'sharp';
import ffmpeg from '@ffmpeg-installer/ffmpeg';

const run = promisify(execFile);
const aqui = path.dirname(new URL(import.meta.url).pathname);
const salida = path.resolve(aqui, '../bocetos/media');
const tmp = path.join(aqui, '.descargas');
const fuentes = JSON.parse(await readFile(path.join(aqui, 'fuentes.json'), 'utf8'));

// curl respeta el proxy del sistema (HTTPS_PROXY), fetch de Node no.
const bajar = (url, destino) => run('curl', ['-sSfL', '-m', '600', '-A', 'Mozilla/5.0', '-o', destino, url]);
const ff = (...args) => run(ffmpeg.path, ['-y', '-loglevel', 'error', ...args], { maxBuffer: 1 << 26 });

await mkdir(path.join(salida, 'fotos'), { recursive: true });
await mkdir(tmp, { recursive: true });
const creditos = ['# Créditos de medios', '', 'Todos los archivos provienen de bancos con licencia libre para uso comercial.', ''];

for (const [nombre, v] of Object.entries(fuentes.videos)) {
  if (!v.url) { console.log(`- video ${nombre}: sin URL, se omite`); continue; }
  const crudo = path.join(tmp, nombre + '.src');
  console.log(`- video ${nombre}: descargando`); await bajar(v.url, crudo);
  const T = v.duracion || 12, F = v.fundido ?? 1;
  const corte = ['-ss', String(v.inicio || 0), '-t', String(T), '-i', crudo, '-an'];
  for (const [suf, alto, crf] of [['', 1080, 23], ['-720', 720, 26]]) {
    // El último segundo se funde con el primero: el video se repite sin salto.
    const fc = `[0:v]scale=-2:${alto}:flags=lanczos,fps=30,setsar=1,split[a][b];` +
      `[a]trim=start=${F},setpts=PTS-STARTPTS[m];` +
      `[b]trim=end=${F},setpts=PTS-STARTPTS,format=yuva420p,fade=t=in:st=0:d=${F}:alpha=1,setpts=PTS+${T - 2 * F}/TB[h];` +
      `[m][h]overlay=eof_action=pass,format=yuv420p[o]`;
    const base = [...corte, '-filter_complex', fc, '-map', '[o]'];
    await ff(...base, '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', String(crf), '-movflags', '+faststart', path.join(salida, `${nombre}${suf}.mp4`));
    await ff(...base, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(crf + 10), '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', path.join(salida, `${nombre}${suf}.webm`));
  }
  await ff('-i', path.join(salida, `${nombre}.mp4`), '-frames:v', '1', path.join(tmp, nombre + '.png'));
  await sharp(path.join(tmp, nombre + '.png')).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(salida, `${nombre}.jpg`));
  creditos.push(`- Video \`${nombre}\`: ${v.autor} — ${v.pagina}`);
}
for (const [nombre, f] of Object.entries(fuentes.fotos)) {
  if (!f.url) { console.log(`- foto ${nombre}: sin URL, se usa la ilustración`); continue; }
  const crudo = path.join(tmp, nombre + '.img');
  console.log(`- foto ${nombre}: descargando`); await bajar(f.url, crudo);
  if (f.cuadrada) await sharp(crudo).rotate().resize(f.cuadrada, f.cuadrada, { fit: 'cover', position: 'attention' }).jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(salida, 'fotos', `${nombre}.jpg`));
  else for (const [suf, ancho, q] of [['', 1600, 78], ['-800', 800, 76]]) {
    await sharp(crudo).rotate().resize({ width: ancho, height: Math.round(ancho * .75), fit: 'cover', position: 'attention' }).jpeg({ quality: q, mozjpeg: true }).toFile(path.join(salida, 'fotos', `${nombre}${suf}.jpg`));
  }
  creditos.push(`- Foto \`${nombre}\`: ${f.autor} — ${f.pagina}`);
}
await writeFile(path.join(salida, 'CREDITOS.md'), creditos.join('\n') + '\n');
await rm(tmp, { recursive: true, force: true });
console.log('Listo. Archivos en bocetos/media/');
