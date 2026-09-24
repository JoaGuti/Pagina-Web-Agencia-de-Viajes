/** Verifica el desafío anti-spam de Cloudflare Turnstile. Si no está configurado, deja pasar. */
export async function turnstileValido(token: unknown, ip: string) {
  const secreto = process.env.TURNSTILE_SECRET_KEY;
  if (!secreto || !process.env.TURNSTILE_SITE_KEY) return true;
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: secreto, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(8000),
    });
    const j = await r.json() as { success?: boolean };
    return !!j.success;
  } catch { return false; }
}
