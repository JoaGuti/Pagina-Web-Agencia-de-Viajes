import { NextResponse, type NextRequest } from 'next/server';
import { cerrarSesion } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  await cerrarSesion(req, res).catch(e => console.error(e));
  return res;
}
