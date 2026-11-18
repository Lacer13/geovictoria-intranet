# Edición, búsqueda, novedades y correo

## Administración

En **Administración → Gestor de Noticias** o **Directorio de Soporte**, usa **Editar** junto al registro. También puedes buscar y crear registros desde esas vistas.

- La edición conserva el identificador; una publicación conserva su fecha original.
- Los campos se validan antes de guardar y las reglas siguen exigiendo administración autorizada.
- Si otra persona cambió el registro, el guardado se detiene y mantiene tu texto. El listado recibe la versión actual: cierra descartando o copiando tus cambios y vuelve a abrir **Editar** para revisar esa versión.
- Cancelar o cerrar un editor modificado exige decidir si se conservan o descartan los cambios.
- La lista refleja los datos confirmados por la base de datos después de guardar.

## Búsqueda y novedades

Abre la lupa o usa `Ctrl + K` / `⌘ + K`. Puedes buscar varias palabras en títulos y contenido de las guías, nombres, áreas, correos y publicaciones. **Ver todos los resultados** abre `/buscar`, con filtros por tipo y carga de más resultados.

**Inicio → Lo que está pasando → Ver todas** o **Campana → Ver todas las publicaciones** abre `/novedades`. La campana cuenta publicaciones sin leer; abrir un artículo lo marca como leído. Una modificación del texto, título o tipo lo vuelve a marcar pendiente. También puedes marcar todas como leídas.

Las lecturas son preferencias de este navegador, no un acuse corporativo ni una sincronización entre dispositivos. No se indexan mensajes privados ni sorteos. La búsqueda usa en el cliente los recursos públicos cargados; no incorpora un servicio externo de indexación.

## Outlook y Amigo secreto

En **Administración → Amigo secreto → Configurar correo**:

1. Abre **Conectar Outlook paso a paso**. El titular crea la cuenta EmailJS y conecta su Outlook 365. Si Microsoft exige autorización organizativa, interviene su administrador.
2. Crea la plantilla con destinatario `{{to_email}}`, sin CC/BCC. Los botones copian el contenido HTML y el asunto. Autoriza el origen de la intranet y consulta la cuota del proveedor.
3. Guarda Service ID, Template ID y clave pública. Habilita envíos. No se guardan contraseñas ni claves privadas.
4. Pulsa **Enviar prueba a mi correo** y confirma el destinatario. Solo puede utilizar el correo de la cuenta administradora conectada. La prueba no carga participantes ni genera parejas.
5. Comprueba Outlook y marca la recepción únicamente si llegó. Aceptación del proveedor y recepción son estados diferentes; la confirmación manual dura la sesión del diálogo.
6. Prepara un ensayo consentido antes de enviar al grupo completo. Si un envío queda incierto, revisa el historial antes de repetirlo. El lote sigue dependiendo del navegador abierto.

En emuladores se muestra **Prueba simulada: no se envió ningún correo** y no se llama al proveedor. En producción hace falta una conexión real del titular; el código preparado no sustituye esa autorización.

## Detalles visuales

- El favicon usa un SVG cuadrado con el símbolo GeoVictoria y una URL versionada, en lugar del logo horizontal reducido.
- La miniatura clásica del juego muestra la primera pose de su lámina; al jugar utiliza una pose por estado.
- **No mostrar automáticamente durante esta Navidad** guarda una preferencia local. El saludo sigue disponible en el menú y en el inicio.

## Verificación de esta entrega

- 26 pruebas de lógica y 22 pruebas de reglas en `demo-geovictoria`, sin mutaciones en producción.
- Recorridos locales de guardado de noticias/contactos, persistencia, descarte y conflicto de edición.
- Búsqueda por contenido con doce resultados ficticios; lectura individual, marcado global y persistencia al recargar.
- Prueba de correo simulada y bloqueo de configuración no guardada.
- Revisión móvil de novedades, modo oscuro, preferencia de bienvenida, miniatura y juego, y favicon sobre fondos claros/oscuros.

La recepción real de Outlook queda pendiente hasta que el titular conecte su cuenta y confirme la prueba.
