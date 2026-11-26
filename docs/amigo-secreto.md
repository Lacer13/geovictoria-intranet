# Amigo secreto de Navidad

## Activar correo sin dominio propio

1. El titular crea su cuenta en [EmailJS](https://dashboard.emailjs.com/sign-up) y conecta su Outlook desde **Email Services → Add New Service → Outlook 365** (Gmail también es compatible). Debe revisar y autorizar personalmente el acceso a su correo.
2. Crea una plantilla en **Email Templates**. En **To Email** coloca `{{to_email}}`, en **To Name** coloca `{{to_name}}` y como asunto `🎁 Tu amigo secreto · {{event_title}}`. Usa el remitente de la cuenta conectada; no configures destinatarios adicionales, CC ni BCC que expongan las asignaciones.
3. En la intranet, entra en **Administración → Amigo secreto → Configurar correo**. Pulsa **Copiar contenido HTML** y pégalo en el editor de código de la plantilla de EmailJS. Guarda la plantilla.
4. Si tu plan incluye la restricción de dominios, en la seguridad de EmailJS autoriza el origen `https://geovictoria-intranet-peru.web.app`. Si utilizas otro dominio de Hosting, autorízalo también. Consulta las funciones de tu plan en la [tabla oficial](https://www.emailjs.com/pricing/); no todos incluyen esta restricción. Mantén deshabilitado el uso de clave privada obligatorio para este flujo desde el navegador.
5. Copia el **Service ID**, **Template ID** y **Public Key** en el formulario de la intranet, marca **Habilitar envíos automáticos desde el panel** y guarda. No ingreses contraseñas, tokens OAuth ni claves privadas.
6. Verifica la cuota vigente en el [panel y plan de EmailJS](https://www.emailjs.com/pricing/). Las pruebas y los reenvíos consumen solicitudes. Revisa también las condiciones de la cuenta Outlook conectada; una cuenta personal está orientada a volúmenes pequeños.
7. Sin cerrar **Configurar correo**, pulsa **Enviar prueba a mi correo**. La confirmación muestra el destinatario: únicamente el administrador conectado. La prueba usa contenido ficticio claramente identificado y un enlace a la página de Amigo secreto, sin clave privada ni datos de participantes. No genera sorteos.
8. Si el proveedor acepta la solicitud, abre Outlook y comprueba bandeja de entrada, spam y el contenido del mensaje. Marca la recepción solo después de recibirlo. Esa confirmación se mantiene únicamente en la sesión del diálogo y no certifica envíos posteriores. Ante un resultado incierto, revisa el historial antes de repetir la prueba; el panel aplica una espera mínima de un minuto entre intentos.
9. Realiza después un sorteo pequeño con personas informadas y direcciones bajo tu control. Comprueba recuperación y reenvío manteniendo las mismas parejas. Guardar los identificadores o recibir una respuesta del proveedor no garantiza entrega en la bandeja.

La conexión de Outlook la autoriza el titular de la cuenta. Si Microsoft exige consentimiento organizativo, debe intervenir el administrador de Microsoft 365. La aplicación no crea esa cuenta ni acepta términos o permisos en nombre del usuario. Una configuración modificada debe guardarse antes de probarla; si otro administrador la cambia, se exige recargarla.

EmailJS permite [conectar servicios personales de correo](https://www.emailjs.com/docs/user-guide/connecting-email-services/). Los identificadores públicos están pensados para aplicaciones web; la restricción de origen y una plantilla limitada ayudan a reducir abuso. El proveedor recibe el correo del participante, su nombre, la asignación y los detalles incluidos en la plantilla. La aplicación no lee tu buzón.

## Bienvenida navideña en las invitaciones · 26 de noviembre de 2026

Las invitaciones privadas incorporan un guardián del juego elegido al azar, decorando un árbol y saludando junto a un reno animado. El saludo se puede pausar y repetir, termina solo y respeta Reducir movimiento y Decoración quieta. El botón de descubrir el resultado sigue disponible desde el principio; la animación no consulta ni modifica las parejas.

La [guía de los saludos](saludos-navidenos-invitaciones.md) explica los recursos reutilizados, los controles y las comprobaciones. Los enlaces existentes muestran esta bienvenida al volver a abrirlos. La publicación solo actualiza Hosting y no cambia cuentas, reglas ni sorteos.

## Tabla rápida de parejas · 26 de noviembre de 2026

En un intercambio sorteado, abre **Tabla de parejas**. La tabla mantiene «Entrega» y «Recibe» en columnas contiguas, incluso en móvil, con encabezados fijos y desplazamiento interno para consultar hasta 100 parejas.

- Busca por nombre o correo de quien entrega o de quien recibe, sin distinguir tildes.
- Ordena por cualquiera de las dos personas. Los correos se muestran solo si activas la casilla correspondiente.
- **Copiar tabla** permite pegar las parejas visibles en una hoja de cálculo. **Descargar CSV** exporta esa misma vista filtrada y ordenada, con correos únicamente si están visibles.
- Esta exportación rápida no contiene enlaces personales. **Respaldo completo con enlaces** conserva la exportación administrativa de todo el grupo.
- **Ocultar parejas** vuelve a las invitaciones. Las parejas se mantienen ocultas al abrir nuevamente el módulo.

La vista requiere `santa.view`. Un perfil sin permisos de Amigo secreto no puede cargar eventos, participantes ni asignaciones, aunque ingrese directamente a la dirección del módulo. Los [perfiles y cuentas configuradas](perfiles-y-permisos.md) y el [registro de producción](releases/perfiles-parejas-production-2026-11-26.json) documentan la publicación.

## Preparar y sortear

- Crea un sorteo con título y, opcionalmente, fecha, presupuesto e indicaciones.
- Añade entre 2 y 100 personas. Puedes pegar líneas `Nombre; correo`, separadas también por tabulación. No se admiten correos duplicados.
- Guarda el borrador. Si otro administrador lo cambia, recárgalo antes de continuar.
- Revisa el grupo y confirma **Realizar sorteo**. Cada persona recibe una asignación diferente de sí misma; todos reciben exactamente un regalo.
- Las parejas y el grupo quedan guardados de forma atómica y no se pueden volver a sortear ni editar en ese evento. Para otro intercambio crea un sorteo nuevo.
- **Enviar correos pendientes** muestra una segunda confirmación. Mantén la página abierta hasta terminar. Puedes detener el lote después del mensaje actual.

## Compartir sin correo

Después de sortear, entra en **Administración → Amigo secreto** y selecciona el intercambio. La tabla **Invitaciones del equipo** utiliza los enlaces ya guardados, también para sorteos anteriores. No genera otras parejas y funciona aunque no hayas configurado EmailJS o se haya agotado su cuota. En móvil, **Elegir un sorteo** abre la lista de intercambios.

1. Busca a la persona por nombre o correo.
2. Pulsa **Copiar enlace** o **Copiar mensaje** en su fila y compártelo únicamente con esa persona por el canal que elijas. La plataforma copia; no envía el mensaje por ti.
3. La persona abre el enlace y pulsa **Descubrir mi amigo secreto**. No necesita cuenta. Puede guardar su enlace para consultar de nuevo el mismo resultado.
4. **Descargar todos los enlaces** genera un CSV para Excel con participante, correo y enlace personal. Incluye a todo el grupo aunque la tabla esté filtrada. No añade una columna con las parejas.

La tabla y el archivo completo son para administradores: quien recibe un enlace puede ver esa asignación. Comparte solo la fila individual, nunca el CSV completo con el grupo. **Mostrar parejas** es una acción separada; permite consultar y descargar el respaldo con asignaciones. En teléfono, cada fila se presenta como una tarjeta con los mismos controles.

**Correo automático (opcional)** conserva el envío, historial, reintentos y controles de cuota. Compartir o abrir enlaces no realiza solicitudes de correo a EmailJS. El estado de correo indica solicitudes al proveedor, no si una persona recibió un enlace por otro canal o leyó su asignación.

**Ver estado de correos** muestra la columna de correo y sus filtros. **Mostrar parejas** revela el respaldo de asignaciones de forma independiente. La confirmación **Enlace copiado** o **Mensaje copiado** solo indica que se copió al portapapeles; la plataforma no envía ese mensaje por otro canal. **Ver enlace personal** permite copiarlo manualmente.

## Límites de correo

Según la [tabla oficial de planes de EmailJS](https://www.emailjs.com/pricing/), consultada el 23 de noviembre de 2026, el plan gratuito incluye **200 solicitudes mensuales**. Las pruebas y los reenvíos usan cuota. La [API de envío](https://www.emailjs.com/docs/rest-api/send/) admite una solicitud por segundo; el lote de la intranet espera 1,2 segundos entre envíos y se detiene ante un límite o resultado incierto.

El plan y el saldo real se revisan en el panel de la cuenta conectada; la intranet no puede consultarlos ni presenta un saldo calculado como si fuera oficial. El proveedor de correo conectado también puede aplicar sus propios límites. La ayuda sobre cuotas está disponible en la configuración y en el apartado opcional de correo del sorteo.

## Estados y reintentos

- **Pendiente**: no hay un intento registrado.
- **Aceptado por EmailJS**: el proveedor aceptó la solicitud. No garantiza recepción en la bandeja de entrada; consulta el historial y spam.
- **En proceso / por confirmar**: hay un intento reservado. No se puede iniciar otro durante 90 segundos. Si se cerró la página o se interrumpió la conexión, revisa el historial antes de reintentar.
- **Revisar historial**: no se pudo confirmar el resultado de la solicitud. El lote se detiene y exige reconocer la revisión del historial antes de reenviar; podría haberse enviado el mensaje original.
- **No enviado**: el proveedor rechazó el intento. Corrige la configuración o cuota y vuelve a enviarlo. No se cambia la pareja.

El lote espera más de un segundo entre solicitudes y se detiene ante cuota agotada, problemas generales o un resultado incierto. No hay reintentos HTTP automáticos. Dos administradores no pueden reservar simultáneamente el mismo envío. No se promete entrega exactamente una vez ante fallos de red: un reenvío manual puede duplicar un mensaje ya aceptado.

## Recuperación y privacidad

Solo los administradores pueden leer el grupo completo, sus correos, el respaldo y el historial de intentos. La lista de parejas está oculta visualmente hasta pulsar **Mostrar parejas**. Ambos CSV contienen enlaces privados; el respaldo de parejas incluye además las asignaciones. Guárdalos únicamente donde corresponda.

Cada participante recibe un enlace con una clave aleatoria de 256 bits en el fragmento de la URL. Cualquiera que tenga ese enlace puede consultar esa asignación sin iniciar sesión. No se publica un listado de claves ni el correo de la persona destinataria. El enlace permite ocultar y volver a revelar el regalo.

**Archivar sorteo** conserva el respaldo y desactiva sus enlaces públicos; restaurarlo reactiva las mismas parejas. El panel no elimina eventos ni rota enlaces individuales. Si se comparte un enlace por error, archiva el evento para suspenderlo.

Un correo reservado antes de archivar puede terminar y registrar su resultado (aceptado, rechazado o incierto). Archivar impide reservar nuevos envíos y reintentos, incluso desde otra sesión de administración.

El modo de emuladores muestra un aviso visible y registra envíos simulados; nunca contacta a EmailJS. No se cargan participantes ni configuración de ejemplo en producción.

## Verificación de la tabla de enlaces

23 de noviembre de 2026: 107 pruebas del portal y 30 de permisos correctas, con compilación de producción. Se comprobó en el emulador crear y guardar un sorteo de tres personas, copiar enlace y mensaje, buscar por nombre y descargar a todo el grupo desde una vista filtrada. El CSV descargado contiene tres columnas sin destinatario del regalo. La invitación se abrió sin sesión y reveló la asignación; una simulación de correo conservó el mismo enlace. No se enviaron correos reales ni se crearon sorteos de prueba en producción.

La tabla se revisó a 375 × 812 y 320 × 568 sin desbordamiento horizontal. Capturas con datos ficticios: [escritorio](../design/amigo-secreto/2026-11-23/tabla-escritorio.jpg), [móvil](../design/amigo-secreto/2026-11-23/tabla-movil.jpg), [invitación](../design/amigo-secreto/2026-11-23/invitacion-demo.jpg). [Vista previa](https://geovictoria-intranet-peru--santa-enlaces-mlgn75mr.web.app/admin?seccion=amigo-secreto), disponible hasta el 30 de noviembre. [Registro de verificación](releases/santa-enlaces-preview-2026-11-23.json).

## Publicación de la tabla de enlaces

La tabla está publicada desde el 23 de noviembre de 2026 en [Administración → Amigo secreto](https://geovictoria-intranet-peru.web.app/admin?seccion=amigo-secreto), tras la autorización y fusión del [PR #6](https://github.com/Lacer13/geovictoria-intranet/pull/6). Se promovió la versión inmutable `b1048f2f30f1f5ae` de la vista previa validada. Las 107 pruebas del portal, las 30 de permisos y la compilación de main pasaron en [GitHub Actions](https://github.com/Lacer13/geovictoria-intranet/actions/runs/45216197014).

Se verificaron 20 recursos por SHA-256, seis rutas y los encabezados de seguridad. La página pública y su ayuda sobre enlaces por mensaje o correo se comprobaron en el navegador de producción, sin generar sorteos ni enviar correos reales. [Captura de producción](../design/amigo-secreto/2026-11-23/produccion.jpg). [Registro y reversión](releases/santa-enlaces-production-2026-11-23.json).

## Revisión funcional del 25 de noviembre de 2026

Se revisaron la preparación del grupo, el algoritmo, las transacciones, los enlaces, los CSV, el correo y las reglas de acceso. Se corrigió un fallo reproducible: archivar desde otra sesión impedía guardar la respuesta de un correo ya reservado. La nueva prueba comprueba los tres resultados posibles y rechaza nuevos envíos y reintentos mientras el evento está archivado. También se ajustó la ayuda de EmailJS para no presentar la restricción de dominios como disponible en todos los planes, según su [tabla oficial](https://www.emailjs.com/pricing/).

Verificación local con datos ficticios:

- 111 pruebas generales y 36 pruebas de reglas de acceso correctas, incluida la regresión del archivado.
- Compilación de producción correcta.
- Importación y guardado de tres participantes, edición de fecha, sorteo y recuperación de enlaces desde Administración.
- Copia de enlace y mensaje, búsqueda y descarga CSV desde una tabla filtrada: el archivo conserva las tres personas y solo contiene participante, correo y enlace.
- Envío individual, reenvío y lote pendiente simulados; los enlaces guardados se mantienen.
- Invitación sin sesión: archivar bloquea su consulta y restaurar reactiva el mismo enlace. Revelar, ocultar y recargar conserva la asignación.
- Tabla e invitación comprobadas a 375 px sin desbordamiento horizontal. [Captura de invitación con datos ficticios](../design/amigo-secreto/2026-11-25/revision-invitacion-movil.jpg).

Los cambios de esta revisión se publicaron el 25 de noviembre de 2026 junto con las mejoras de experiencia. No se enviaron correos reales ni se modificaron sorteos de producción durante la verificación. La recepción real de EmailJS/Outlook y la configuración de la cuenta del proveedor requieren una comprobación operativa aparte.

## Mejoras de experiencia del 25 de noviembre de 2026

- **Participantes:** formulario de invitación visible al entrar, ayuda de recuperación y acceso de organización separados. La invitación muestra fecha, presupuesto e indicaciones antes de revelar la asignación. Se puede ocultar el resultado y copiar el enlace para recuperarlo.
- **Administración:** cabecera más compacta, búsqueda de intercambios y selector plegable en móvil. El indicador de pasos señala cuándo el borrador guardado está listo para sortear. Las invitaciones tienen acciones de copia con confirmación en su fila; el correo y las parejas se consultan por separado.
- **Formularios:** textos y controles más legibles, revisión de nombres al salir del campo y aviso para añadir una lista pegada antes de guardar. Se mantiene la advertencia ante cambios sin guardar al cambiar de intercambio.
- **Adaptación visual:** formularios, tarjetas y acciones revisados en móvil; colores del tema y preferencia de movimiento reducido respetados.

Comprobaciones con datos ficticios en los emuladores: importar y guardar grupos de dos y tres personas; sortear; copiar enlace y mensaje; consultar el correo opcional y simular un envío; buscar intercambios; abrir la invitación sin sesión; revelar, recargar y recuperar la misma asignación. Se revisaron vistas de 320, 375 y 1280 px, además del modo oscuro. Las 111 pruebas generales y la compilación de producción pasaron.

Capturas locales con datos ficticios: [inicio](../design/amigo-secreto/2026-11-25/ux-inicio-escritorio.jpg), [inicio móvil](../design/amigo-secreto/2026-11-25/ux-inicio-movil.jpg), [administración](../design/amigo-secreto/2026-11-25/ux-administracion-escritorio.jpg), [administración móvil](../design/amigo-secreto/2026-11-25/ux-administracion-movil.jpg), [borrador móvil](../design/amigo-secreto/2026-11-25/ux-borrador-movil.jpg) e [invitación móvil](../design/amigo-secreto/2026-11-25/ux-invitacion-movil.jpg).

## Publicación de las mejoras de experiencia

25 de noviembre de 2026: mejoras y corrección del archivado publicadas en [Amigo secreto](https://geovictoria-intranet-peru.web.app/amigo-secreto) y [Administración](https://geovictoria-intranet-peru.web.app/admin?seccion=amigo-secreto), con autorización del usuario. La versión de Hosting es `570004e6d01e286b`; se actualizaron también las reglas de Firestore verificadas.

Las 111 pruebas generales y las 36 de permisos pasaron. Se verificaron siete rutas, los 46 archivos compilados por SHA-256, los encabezados de seguridad y la coincidencia de las reglas publicadas con el código validado. En el navegador de producción se revisaron la página pública a 375 y 1280 px y la recuperación ante un enlace incompleto. Los enlaces personales conservan su ruta directa; el formulario de la página general sigue siendo una alternativa. No se crearon sorteos ni se enviaron correos reales durante esta publicación.

[Captura de producción](../design/amigo-secreto/2026-11-25/ux-produccion.jpg). El [registro de publicación](releases/santa-experiencia-production-2026-11-25.json) incluye las versiones anterior y nueva de Hosting y Firestore, los hashes del código y los datos para revertir la publicación.
