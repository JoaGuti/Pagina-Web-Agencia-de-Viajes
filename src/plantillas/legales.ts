import { FECHA_LEGALES } from '@/contenido/sitio';
import type { ConfigDatos } from '@/lib/db/schema';
import { direccionCompleta } from '@/lib/formato';
import { html, type Crudo } from '@/lib/html';

export type Legal = { titulo: string; descripcion: string; cuerpo: (cfg: ConfigDatos) => Crudo };

const marco = (titulo: string, eyebrow: string, contenido: Crudo) => html`
<section class="paper sec legal-pag" data-doodles="6">
  <div class="wrap legal-wrap">
    <nav class="migas" aria-label="Ruta de navegación"><a href="/">Inicio</a><span aria-hidden="true">/</span><span aria-current="page">${titulo}</span></nav>
    <p class="eyebrow">${eyebrow}</p>
    <h1 class="h2">${titulo}</h1>
    <div class="legal-texto">${contenido}</div>
  </div>
</section>`;

export const LEGALES: Record<string, Legal> = {
  privacidad: {
    titulo: 'Política de privacidad',
    descripcion: 'Cómo tratamos tus datos personales según la Ley 25.326 de Protección de Datos Personales.',
    cuerpo: cfg => {
      const a = cfg.agencia;
      return marco('Política de privacidad', 'Legales', html`
<p class="actualizado">Última actualización: ${FECHA_LEGALES}.</p>
<h2>1. Responsable</h2>
<p>${a.razonSocial || a.nombre}, CUIT ${a.cuit}, con domicilio en ${direccionCompleta(cfg)}, es responsable de la base de datos de clientes y consultas. Podés escribirnos a <a href="mailto:${a.email}">${a.email}</a>.</p>
<h2>2. Qué datos recolectamos</h2>
<ul>
  <li>Datos de contacto que nos das en formularios o por WhatsApp: nombre, teléfono, email, destino y fecha de viaje.</li>
  <li>Datos necesarios para reservar: documento, pasaporte, fecha de nacimiento y datos de acompañantes.</li>
  <li>Datos técnicos de navegación (cookies analíticas), solo con tu consentimiento.</li>
</ul>
<h2>3. Para qué los usamos</h2>
<p>Para responder consultas, cotizar y gestionar reservas, emitir comprobantes, cumplir obligaciones legales y, si te suscribís, enviarte ofertas. No vendemos ni cedemos tus datos con fines comerciales.</p>
<h2>4. Con quién los compartimos</h2>
<p>Solo con los prestadores necesarios para tu viaje (aerolíneas, hoteles, operadores mayoristas, compañías de asistencia) y con autoridades cuando la ley lo exige. El sitio se aloja en proveedores de infraestructura en la nube que pueden estar fuera de Argentina; en esos casos la transferencia se hace para prestar el servicio que solicitaste y con proveedores que aplican medidas de seguridad adecuadas.</p>
<h2>5. Seguridad</h2>
<p>El sitio usa conexión cifrada (HTTPS). El acceso a los datos está restringido al personal autorizado de la agencia, con usuarios individuales, contraseñas robustas guardadas de forma irreversible y bloqueo automático ante intentos fallidos. Los formularios tienen protección contra envíos automáticos.</p>
<h2>6. Tus derechos</h2>
<p>Podés pedir acceso, rectificación, actualización o supresión de tus datos escribiendo a <a href="mailto:${a.email}">${a.email}</a>. También podés darte de baja de las ofertas en cualquier momento.</p>
<p>El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326.</p>
<p>La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.</p>
<h2>7. Conservación</h2>
<p>Guardamos los datos de reservas durante el plazo que exigen las normas fiscales y comerciales. Las consultas que no terminan en reserva se eliminan a los 24 meses.</p>
<h2>8. Menores</h2>
<p>Los datos de menores se reciben solo a través de sus padres o tutores y únicamente para gestionar el viaje.</p>
<h2>9. Cambios</h2>
<p>Si modificamos esta política, publicamos la nueva versión en esta página con su fecha de actualización.</p>`);
    },
  },
  terminos: {
    titulo: 'Términos y condiciones',
    descripcion: 'Condiciones generales de contratación de servicios turísticos.',
    cuerpo: cfg => {
      const a = cfg.agencia;
      return marco('Términos y condiciones', 'Legales', html`
<p class="actualizado">Última actualización: ${FECHA_LEGALES}.</p>
<h2>Agencia</h2>
<p>${a.razonSocial || a.nombre} es una agencia de viajes habilitada por el Ministerio de Turismo de la Nación, Legajo EVyT N° ${a.legajo}, CUIT ${a.cuit}, y se rige por la Ley 18.829 y sus normas complementarias.</p>
<h2>Precios</h2>
<p>Los precios publicados son por persona en base doble, salvo que se indique otra cosa, y están sujetos a disponibilidad y a variaciones de tarifas aéreas, impuestos y tipo de cambio hasta la confirmación de la reserva. Las referencias en pesos son orientativas.</p>
<h2>Reservas y pagos</h2>
<p>La reserva queda confirmada con el pago de la seña indicada y la emisión del comprobante correspondiente. Los saldos deben cancelarse en los plazos que informe la agencia.</p>
<h2>Cancelaciones y cambios</h2>
<p>Las penalidades dependen de cada prestador y se informan por escrito antes del pago. Si contrataste a distancia, podés usar el <a href="/arrepentimiento">botón de arrepentimiento</a> dentro de los plazos que fija la ley.</p>
<h2>Documentación</h2>
<p>Es responsabilidad del pasajero contar con la documentación vigente y cumplir los requisitos migratorios y sanitarios del destino. La agencia informa los requisitos conocidos al momento de la reserva.</p>
<h2>Ofertas</h2>
<p>Las ofertas tienen vigencia y cupos limitados. Vencido el plazo o agotados los lugares, vuelve el precio normal del paquete.</p>`);
    },
  },
  cookies: {
    titulo: 'Política de cookies',
    descripcion: 'Qué cookies usa el sitio y cómo cambiar tu elección.',
    cuerpo: () => marco('Política de cookies', 'Legales', html`
<p class="actualizado">Última actualización: ${FECHA_LEGALES}.</p>
<h2>Esenciales</h2>
<p>Guardan tu preferencia de cookies y protegen los formularios contra spam. No se pueden desactivar porque el sitio las necesita para funcionar.</p>
<h2>Analíticas (opcionales)</h2>
<p>Con tu permiso usamos Google Analytics para saber, de forma agregada y anónima, qué páginas y destinos se visitan más. Solo se activan si aceptás en el aviso de cookies.</p>
<p><button class="btn outline" type="button" id="ckReset">Cambiar mi elección</button></p>`),
  },
  arrepentimiento: {
    titulo: 'Botón de arrepentimiento',
    descripcion: 'Revocá una compra hecha a distancia (Ley 24.240, art. 34 y Resolución 424/2020).',
    cuerpo: () => marco('Botón de arrepentimiento', 'Defensa del consumidor', html`
<p>Si contrataste a distancia (por internet, teléfono o WhatsApp), podés revocar la compra dentro de los 10 días corridos desde la contratación o la entrega del servicio, lo último que ocurra (art. 34 de la Ley 24.240 y Resolución 424/2020), con las excepciones que prevé la normativa para servicios de fecha determinada.</p>
<p>Al enviar el formulario te mostramos un código de identificación del trámite y te lo mandamos por email.</p>
<form class="regret-form" id="regretForm" novalidate>
  <div class="hp" aria-hidden="true"><input name="web" tabindex="-1" autocomplete="off"></div>
  <div class="field"><label for="r-nombre">Nombre y apellido</label><input id="r-nombre" name="nombre" autocomplete="name" required maxlength="80"></div>
  <div class="field"><label for="r-dni">DNI</label><input id="r-dni" name="dni" inputmode="numeric" required maxlength="12"></div>
  <div class="field"><label for="r-email">Email</label><input id="r-email" name="email" type="email" autocomplete="email" required maxlength="120"></div>
  <div class="field"><label for="r-reserva">N° de reserva o factura</label><input id="r-reserva" name="reserva" required maxlength="40"></div>
  ${process.env.TURNSTILE_SITE_KEY ? html`<div class="field full" data-turnstile="arrepentimiento"></div>` : ''}
  <div class="field full"><button class="btn" type="submit">Enviar solicitud</button></div>
</form>
<div class="regret-ok" id="regretOk" hidden role="status">
  <b>Recibimos tu solicitud.</b>
  <p>Tu código de trámite es <span class="mono" id="regretCode"></span>. Guardalo: también te lo enviamos por email.</p>
</div>`),
  },
};
