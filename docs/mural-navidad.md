# Mural de Navidad en equipo

20 de noviembre de 2026. El editor anterior solo copiaba el saludo. Esta entrega añade un periódico mural en `/navidad`, con publicación compartida, destinatario opcional, firma o «Anónimo» y fecha del servidor mostrada en hora de Lima. Se conserva la opción de copiar el saludo.

**Publicado en [Navidad en equipo](https://geovictoria-intranet-peru.web.app/navidad)** con autorización del usuario. El [PR #4](https://github.com/Lacer13/geovictoria-intranet/pull/4) está integrado en `main`; se promovió la versión inmutable `7f0f5874f9614a08` de la vista previa probada. Las reglas, el índice y el cliente están activos. [Registro de producción y restauración](releases/mural-navidad-production-2026-11-20.json).

La [vista previa](https://geovictoria-intranet-peru--mural-navidad-pox6l5mb.web.app/navidad) sigue disponible hasta el 27 de noviembre y utiliza el mismo mural compartido. [Registro de la vista previa](releases/mural-navidad-preview-2026-11-20.json).

## Uso

«Escribir un saludo» abre el editor y su vista previa. La firma es el nombre que introduce la persona, no una identidad verificada. Al elegir anonimato, el nombre de la firma se sustituye por `Anónimo` antes de guardar: no se envía un nombre oculto, un correo ni un identificador de autor. El mensaje y el destinatario siguen siendo públicos. El formulario informa que quienes visiten el portal podrán leer el saludo.

La confirmación de publicación espera la respuesta de Firestore; las escrituras locales pendientes no aparecen como saludos confirmados. «Verlo en el mural» lleva a la tarjeta publicada. Los errores conservan el texto y el formulario evita envíos duplicados mientras espera. El mural recibe actualizaciones sin recargar, empieza por los 30 mensajes más recientes y permite ampliar hasta 150 en la edición del año de Lima.

Administración incluye **Mural navideño**, también accesible mediante `/admin?seccion=mural`. Sus cuentas autorizadas pueden ocultar o restaurar publicaciones. Ocultar conserva el documento para restaurarlo, y las reglas impiden leerlo desde una sesión pública. No se permite borrar ni cambiar la firma o el mensaje mediante esta función.

## Datos y despliegue

Los saludos viven en `christmasWalls/{año}/greetings/{id}`. Cada alta contiene solo `recipient`, `authorName`, `isAnonymous`, `message`, `visible` y `createdAt`. La moderación cambia `visible` y `moderatedAt`. Se validan límites, anonimato y fecha del servidor en las reglas. No se modifican las colecciones de reportes, noticias, sorteos, concursos o juego.

El índice de `firestore.indexes.json` combina `visible` y `createdAt` para el listado público. Antes de publicarlo se consultaron los índices de producción: no había índices compuestos ni excepciones que conservar. El despliegue necesita reglas, índice y cliente; publicar únicamente el HTML no habilita el mural. No se añaden cuentas obligatorias, proveedores de autenticación ni servicios de pago.

## Comprobación

- 103 pruebas del portal correctas, incluidas validación del saludo, firma anónima descartada y fecha en Lima.
- 30 pruebas de permisos en el emulador: alta válida, rechazo de datos privados extra y falsa anonimidad, límites de texto, fecha inventada, ocultar/restaurar solo por administradores y lectura pública filtrada.
- Dos navegadores independientes mostraron los saludos creados desde el formulario. Se comprobó en los datos del emulador que el nombre introducido antes de marcar anonimato no quedó guardado.
- Una cuenta ficticia de administración ocultó y restauró un saludo; el segundo navegador público reflejó ambos cambios sin recargar. Se cerró la sesión de prueba.
- Formulario a 320 × 568: controles dentro del ancho disponible, sin desplazamiento horizontal. Las pruebas y ejemplos utilizaron solo `demo-geovictoria` en emuladores locales.

Evidencia local: [mural](../design/navidad/mural-2026-11-20/mural-local.jpg), [formulario móvil](../design/navidad/mural-2026-11-20/movil-local.jpg), [moderación](../design/navidad/mural-2026-11-20/admin-local.jpg). Los saludos de estas capturas son pruebas, no publicaciones reales del equipo.

En producción se verificaron 18 recursos contra la compilación, las cabeceras de seguridad, la consulta pública y las rutas de Navidad, juego y Administración. La pantalla cargó el mural vacío, abrió el editor y cambió correctamente entre firma y anonimato. [Captura de producción](../design/navidad/mural-2026-11-20/produccion.jpg). La [verificación de main](https://github.com/Lacer13/geovictoria-intranet/actions/runs/44806192482) pasó instalación, 103 pruebas, compilación y 30 pruebas de reglas en emulador.

Referencias de Firebase: [consultas y reglas](https://firebase.google.com/docs/firestore/security/rules-query), [actualizaciones en tiempo real](https://firebase.google.com/docs/firestore/query-data/listen).
