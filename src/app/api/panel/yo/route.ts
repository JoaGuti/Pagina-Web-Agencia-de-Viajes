import { NextResponse, type NextRequest } from 'next/server';
import { usuarioActual, usuarioPublico } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const u = await usuarioActual(req);
    return NextResponse.json({ usuario: u ? usuarioPublico(u) : null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'No pudimos conectar con la base de datos.' }, { status: 500 });
  }
}
