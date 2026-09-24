export const GET = (req: Request) => Response.redirect(new URL('/#paquetes', req.url), 308);
