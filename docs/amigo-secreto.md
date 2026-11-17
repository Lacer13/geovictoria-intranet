# Amigo secreto de Navidad

## Activar correo sin dominio propio

1. El titular crea su cuenta en [EmailJS](https://dashboard.emailjs.com/sign-up) y conecta su Gmail u Outlook desde **Email Services**. Debe revisar y autorizar personalmente el acceso a su correo.
2. Crea una plantilla en **Email Templates**. En **To Email** coloca `{{to_email}}`, en **To Name** coloca `{{to_name}}` y como asunto `🎁 Tu amigo secreto · {{event_title}}`. Usa el remitente de la cuenta conectada; no configures destinatarios adicionales, CC ni BCC que expongan las asignaciones.
3. En la intranet, entra en **Administración → Amigo secreto → Configurar correo**. Pulsa **Copiar contenido HTML** y pégalo en el editor de código de la plantilla de EmailJS. Guarda la plantilla.
4. En la seguridad de EmailJS, autoriza el origen `https://geovictoria-intranet-peru.web.app`. Si utilizas otro dominio de Hosting, autorízalo también. Mantén deshabilitado el uso de clave privada obligatorio para este flujo desde el navegador.
5. Copia el **Service ID**, **Template ID** y **Public Key** en el formulario de la intranet, marca **Habilitar envíos automáticos desde el panel** y guarda. No ingreses contraseñas, tokens OAuth ni claves privadas.
6. Verifica la cuota en EmailJS. A fecha 16 de noviembre de 2026, su [plan gratuito](https://www.emailjs.com/pricing/) ofrece 200 solicitudes al mes. Los reenvíos también consumen cuota; el proveedor puede cambiar sus límites.
7. Realiza primero un sorteo pequeño con personas informadas y direcciones bajo tu control. Confirma el envío y revisa recepción, spam y el historial de EmailJS. Guardar los identificadores no verifica la conexión; el primer envío real la comprueba.

EmailJS permite [conectar servicios personales de correo](https://www.emailjs.com/docs/user-guide/connecting-email-services/). Los identificadores públicos están pensados para aplicaciones web; la restricción de origen y una plantilla limitada ayudan a reducir abuso. El proveedor recibe el correo del participante, su nombre, la asignación y los detalles incluidos en la plantilla. La aplicación no lee tu buzón.

## Preparar y sortear

- Crea un sorteo con título y, opcionalmente, fecha, presupuesto e indicaciones.
- Añade entre 2 y 100 personas. Puedes pegar líneas `Nombre; correo`, separadas también por tabulación. No se admiten correos duplicados.
- Guarda el borrador. Si otro administrador lo cambia, recárgalo antes de continuar.
- Revisa el grupo y confirma **Realizar sorteo**. Cada persona recibe una asignación diferente de sí misma; todos reciben exactamente un regalo.
- Las parejas y el grupo quedan guardados de forma atómica y no se pueden volver a sortear ni editar en ese evento. Para otro intercambio crea un sorteo nuevo.
- **Enviar correos pendientes** muestra una segunda confirmación. Mantén la página abierta hasta terminar. Puedes detener el lote después del mensaje actual.

## Estados y reintentos

- **Pendiente**: no hay un intento registrado.
- **Aceptado por EmailJS**: el proveedor aceptó la solicitud. No garantiza recepción en la bandeja de entrada; consulta el historial y spam.
- **En proceso / por confirmar**: hay un intento reservado. No se puede iniciar otro durante 90 segundos. Si se cerró la página o se interrumpió la conexión, revisa el historial antes de reintentar.
- **Revisar historial**: no se pudo confirmar el resultado de la solicitud. El lote se detiene y exige reconocer la revisión del historial antes de reenviar; podría haberse enviado el mensaje original.
- **No enviado**: el proveedor rechazó el intento. Corrige la configuración o cuota y vuelve a enviarlo. No se cambia la pareja.

El lote espera más de un segundo entre solicitudes y se detiene ante cuota agotada, problemas generales o un resultado incierto. No hay reintentos HTTP automáticos. Dos administradores no pueden reservar simultáneamente el mismo envío. No se promete entrega exactamente una vez ante fallos de red: un reenvío manual puede duplicar un mensaje ya aceptado.

## Recuperación y privacidad

Solo los administradores pueden leer el grupo completo, sus correos, el respaldo y el historial de intentos. La lista de parejas está oculta visualmente hasta pulsar **Ver lista de respaldo**. El CSV contiene datos privados; guárdalo únicamente donde corresponda.

Cada participante recibe un enlace con una clave aleatoria de 256 bits en el fragmento de la URL. Cualquiera que tenga ese enlace puede consultar esa asignación sin iniciar sesión. No se publica un listado de claves ni el correo de la persona destinataria. El enlace permite ocultar y volver a revelar el regalo.

**Archivar sorteo** conserva el respaldo y desactiva sus enlaces públicos; restaurarlo reactiva las mismas parejas. El panel no elimina eventos ni rota enlaces individuales. Si se comparte un enlace por error, archiva el evento para suspenderlo.

El modo de emuladores muestra un aviso visible y registra envíos simulados; nunca contacta a EmailJS. No se cargan participantes ni configuración de ejemplo en producción.
