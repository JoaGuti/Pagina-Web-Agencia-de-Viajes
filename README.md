# Plantilla web para agencias de viajes

Sitio público animado con temática de isla tropical y panel de administración para que la agencia cargue paquetes, ofertas y precios sin depender de un programador.

- `bocetos/index.html`: boceto del sitio público.
- `bocetos/panel/`: boceto del panel de administración. No está enlazado desde el sitio; se entra escribiendo la dirección (`/panel/`).
- `bocetos/media/`: video y fotos optimizados (créditos en `CREDITOS.md`).
- `herramientas/`: script que descarga y optimiza los medios (`npm install && npm run medios`).
- `PROPUESTA.md`: alcance, arquitectura, seguridad, SEO, GEO y aspectos legales.

## Ver los bocetos

Abrí `bocetos/index.html` en el navegador. Para que los cambios del panel se vean en la web en vivo, servilos desde la misma carpeta:

```bash
npx serve bocetos
```

Después abrí `http://localhost:3000` y `http://localhost:3000/panel/` en dos pestañas. En el panel se ingresa con cualquier email, una contraseña de 8 caracteres o más y cualquier código de 6 dígitos.

## Publicar

El repositorio ya trae la configuración para Vercel (`vercel.json`) y Netlify (`netlify.toml`): publica la carpeta `bocetos` sin compilar nada, agrega cabeceras de seguridad y marca el panel como no indexable.

**Vercel:** vercel.com → Add New → Project → importar este repositorio de GitHub → Deploy. No hace falta cambiar ninguna opción.

**Netlify:** app.netlify.com → Add new site → Import an existing project → GitHub → este repositorio → Deploy.

Cada cambio que se sube a la rama se publica solo en uno o dos minutos, con la misma dirección.

- Sitio: `https://<tu-proyecto>.vercel.app/`
- Panel: `https://<tu-proyecto>.vercel.app/panel/` (también `/admin`)

En los bocetos, el panel y la web comparten los datos **en el mismo navegador**: si cambiás un precio en el panel, la web abierta en otra pestaña se actualiza al instante. Otras personas u otros dispositivos siguen viendo los datos de ejemplo hasta que exista la versión final con base de datos.

