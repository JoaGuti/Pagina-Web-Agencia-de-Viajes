import { esc } from './html';

/** Envía un email con Resend (https://resend.com) si RESEND_API_KEY está configurada. Nunca rompe el flujo si falla. */
export async function enviarEmail(o: { para: string | string[]; asunto: string; html: string; responderA?: string }) {
  const clave = process.env.RESEND_API_KEY;
  const de = process.env.EMAIL_FROM;
  if (!clave || !de) return false;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: de, to: Array.isArray(o.para) ? o.para : [o.para], subject: o.asunto, html: o.html, reply_to: o.responderA }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) console.error('Resend', r.status, await r.text().catch(() => ''));
    return r.ok;
  } catch (e) { console.error('Resend', e); return false; }
}

/** Destinatarios de avisos internos: NOTIFY_EMAIL (separados por coma) o el email de la agencia. */
export const destinatariosInternos = (emailAgencia: string) =>
  (process.env.NOTIFY_EMAIL || emailAgencia).split(',').map(s => s.trim()).filter(Boolean);

export function tablaEmail(titulo: string, filas: [string, string][], pie = '') {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#1c2230">
<h2 style="font-size:20px;margin:0 0 14px;color:#d62839">${esc(titulo)}</h2>
<table style="border-collapse:collapse;width:100%">${filas.map(([k, v]) => `<tr><td style="padding:8px 10px;border-bottom:1px solid #eee;color:#5b6272;width:34%;vertical-align:top">${esc(k)}</td><td style="padding:8px 10px;border-bottom:1px solid #eee;white-space:pre-wrap">${esc(v)}</td></tr>`).join('')}</table>
${pie ? `<p style="font-size:13px;color:#5b6272;margin-top:16px">${pie}</p>` : ''}</div>`;
}
