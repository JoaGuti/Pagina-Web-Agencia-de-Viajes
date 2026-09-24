import { paginaLegal } from '@/lib/paginas';

export const dynamic = 'force-dynamic';
export const GET = (req: Request) => paginaLegal(req, 'privacidad');
