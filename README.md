# Plantilla web para agencias de viajes

Sitio público animado con temática de isla tropical y panel de administración para que la agencia cargue paquetes, ofertas y precios sin depender de un programador.

- `bocetos/index.html`: boceto del sitio público.
- `bocetos/panel/`: boceto del panel de administración. No está enlazado desde el sitio; se entra escribiendo la dirección.
- `bocetos/media/`: video y fotos optimizados (créditos en `CREDITOS.md`).
- `herramientas/`: script que descarga y optimiza los medios (`npm install && npm run medios`).
- `PROPUESTA.md`: alcance, arquitectura, seguridad, SEO, GEO y aspectos legales.

## Ver los bocetos

Abrí `bocetos/index.html` en el navegador. Para que los cambios del panel se vean en la web en vivo, servilos desde la misma carpeta:

```bash
npx serve bocetos
```

Después abrí `http://localhost:3000` y `http://localhost:3000/panel/` en dos pestañas. En el panel se ingresa con cualquier email, una contraseña de 8 caracteres o más y cualquier código de 6 dígitos.
