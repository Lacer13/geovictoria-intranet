# GeoVictoria Perú · Nuestro espacio

Intranet en React y Vite con Firestore. Incluye inicio, comunicados, directorio, vista de áreas, guías con favoritos, buzón de solicitudes, especial navideño, amigo secreto y la pausa activa de VictorIA.

## Desarrollo

Requiere Node.js 22.12 o posterior compatible con Vite 8.

```sh
npm ci --ignore-scripts
npm run dev
npm test
npm run build
npm run preview
```

`dist/` contiene la aplicación para Firebase Hosting. No se versionan los archivos compilados. `package-lock.json` es el archivo de dependencias de referencia.

## Experiencia y Navidad

- Navegación inmediata; las rutas secundarias se cargan bajo demanda. VictorIA recibe al equipo con un saludo navideño de 14 segundos: llega en trineo, mueve la cabeza y la mano, con música navideña. Se puede saltar, pausar, avanzar y repetir desde **Ver saludo de VictorIA** del inicio o **Video de VictorIA** del menú. La opción **No mostrar automáticamente durante esta Navidad** conserva el acceso manual y se recuerda en este navegador. Las invitaciones privadas y Administración abren directamente.
- Paleta navideña tradicional: rojo Santa, blanco nieve, verde pino y dorado cálido. Menú rojo, banners verdes, ilustraciones con regalos y estrellas doradas, guirnalda de pino y luces; variante oscura en tonos de bosque.
- Interfaz concisa: accesos rápidos al inicio, video integrado en el banner navideño y ayuda desplegable. Navidad muestra las acciones antes que los detalles; los formularios conservan sus datos al plegarse.
- Búsqueda global por varias palabras, sin distinción de tildes: personas y correos, secciones, contenido completo de guías y publicaciones. El diálogo muestra ocho accesos y permite abrir todos los resultados, filtrarlos por tipo y cargar más. Atajo `Ctrl + K` / `⌘ + K`.
- Novedades con página propia, filtros y contador de publicaciones sin leer. Las lecturas se guardan por navegador; una edición de contenido vuelve a marcar la publicación como pendiente. No se afirma sincronización entre cuentas ni dispositivos.
- Administración permite crear y editar noticias/contactos sin cambiar su identificador ni la fecha original de una publicación. Las transacciones detectan ediciones simultáneas y el editor avisa antes de descartar cambios.
- Favicon SVG cuadrado con el símbolo GeoVictoria, sin el texto del logo completo. La miniatura de VictorIA Clásica utiliza una URL CSS válida para el nombre de archivo con espacios.
- Navegación móvil con control de foco; formularios etiquetados y acceso por teclado.
- Modos claro y oscuro, favoritos y preferencias guardados en el navegador. La intranet funciona aunque el almacenamiento de preferencias esté bloqueado.
- Copos de nieve, luces intermitentes, árbol y destellos animados. El botón del copo permite pausar los efectos. Se respeta `prefers-reduced-motion` y se reducen las partículas en móviles.
- Cuenta regresiva y calendario con fechas de Lima. El evento descargable `.ics` corresponde al 25 de diciembre; no se inventan actividades corporativas.
- Ideas personales para compartir y editor de saludos que copia el mensaje sin enviarlo a terceros.
- El QR corresponde al origen actual de la intranet, no a un dominio fijo de ejemplo.

## Datos

Se conservan las colecciones existentes `news`, `directory`, `leaderboard` y `feedbacks`. Las lecturas públicas incluyen espera acotada, estado vacío, error visible y reintento. No se insertan contactos ni noticias automáticamente.

La vista de equipo agrupa los contactos publicados por área; no representa jerarquías ni inventa cargos. Las guías son orientación general y no sustituyen las políticas oficiales de la empresa.

Los reportes se guardan en Firestore; **no se envían correos automáticos**. La opción sin nombre omite nombre y área del documento. No implica anonimato técnico de red. El formulario confirma un envío solo después del reconocimiento de Firestore y conserva el texto ante un error.

## Administración y requisitos para producción

La contraseña administrativa incrustada en JavaScript fue eliminada. Administración utiliza Firebase Authentication. La cuenta principal conserva el custom claim `admin: true`; los administradores adicionales acceden mediante un registro activo en `administrators/{correo-en-minúsculas}` y un correo verificado. Crear una cuenta no concede permisos por sí solo.

Antes de publicar esta versión en producción, el responsable de Firebase debe:

1. Habilitar el proveedor **Correo electrónico/contraseña** en Authentication y crear o habilitar la cuenta principal. No existe concesión pública de permisos de administrador.
2. Asignar `admin: true` al UID autorizado desde un entorno de confianza con Firebase Admin SDK. Nunca se asignan permisos desde el navegador ni se incluyen credenciales del servidor en el repositorio. La cuenta debe cerrar sesión y volver a entrar tras cambiar sus claims.
3. Publicar un registro principal con `role: "owner"` en `administrators/{correo}` desde un entorno de confianza. Este registro no puede modificarse ni eliminarse desde el panel web.
4. Revisar y desplegar `firestore.rules`. El bloqueo visual de una ruta no protege la base de datos por sí solo. Las reglas del repositorio no sustituyen las reglas activas hasta su despliegue.
5. Publicar Hosting después de verificar la configuración de esa cuenta.

### Añadir y retirar administradores

Desde **Administración → Administradores**, una persona autorizada puede:

- Autorizar un correo de trabajo y copiar su enlace de activación.
- Retirar el acceso de otros administradores y reactivarlo después.
- Consultar la cuenta principal y su estado protegido.

La persona invitada crea su propia cuenta desde el enlace, verifica su correo y vuelve a ingresar. Si ya tiene una cuenta o se ha preparado su acceso sin contraseña, utiliza **Activar o recuperar acceso**. Los enlaces de verificación y recuperación se solicitan expresamente desde la pantalla; autorizar a alguien no envía correos automáticamente. No se comparte una contraseña entre administradores.

Los administradores no pueden desactivar la cuenta principal ni su propio acceso, asignarse el rol `owner`, modificar los campos de una autorización o eliminar registros de autorización. Las reglas comprueban la pertenencia activa en cada operación protegida. La pantalla también escucha los cambios de acceso para cerrar la sesión si se revoca una autorización.

Las reglas restringen la lectura y eliminación de reportes a administradores, validan campos y tamaños, restringen la edición de noticias/contactos y bloquean colecciones desconocidas. Noticias, contactos y ranking **siguen siendo de lectura pública**, conforme al acceso de la aplicación actual. El ranking admite puntajes enviados por clientes; no es una competencia con validación de servidor ni un sistema antifraude. Una intranet privada para todos los colaboradores requeriría añadir identidad corporativa y adaptar estas lecturas.

La configuración web de Firebase identifica el proyecto existente; no es una credencial de servidor. La protección depende de las reglas y de Authentication. No guardar archivos de cuentas de servicio en este repositorio.

## Amigo secreto y correo sin dominio propio

Desde **Administración → Amigo secreto** se pueden guardar grupos de 2 a 100 personas, importar una lista de nombres/correos, sortear y enviar las asignaciones. Nadie se asigna a sí mismo; cada persona da y recibe un regalo. Una vez sorteado, el grupo y las parejas quedan fijos. Los reenvíos conservan el resultado original.

**Configurar correo** guía la conexión de Gmail u Outlook mediante EmailJS e incluye la plantilla HTML para copiar. No requiere dominio propio ni cambiar el plan de Firebase. El flujo incluye guía para Outlook 365, copia de plantilla/asunto y una prueba con confirmación enviada solo al correo del administrador conectado. La prueba no lee participantes ni genera asignaciones. Una configuración sin guardar no puede probarse. Se distinguen aceptación del proveedor y confirmación manual de recepción, esta última solo en la sesión del diálogo. La conexión de la cuenta y la autorización del proveedor las realiza su titular; la aplicación no incluye una cuenta de envío preconfigurada ni solicita contraseñas SMTP. Solo se guardan los tres identificadores públicos de EmailJS en una colección accesible a administradores.

El panel registra cada intento y permite consultar el respaldo, descargarlo o recuperar el enlace privado de una persona. Los correos requieren confirmación del administrador; guardar o sortear no los envía. Consulta [la guía de configuración y operación](docs/amigo-secreto.md).

La preparación separa los detalles del intercambio y las personas. Señala correos incompletos o repetidos y avisa antes de descartar cambios al cambiar de sorteo. La entrega tiene un resumen, progreso y filtros por pendientes, aceptados y envíos que requieren revisión. Los participantes pueden pegar su enlace desde la página pública para abrir su invitación.

La bienvenida v4 anima por separado el trineo, la cabeza y la mano de VictorIA. Conserva su cabeza y dos manos flotantes sin torso, con una llegada desde el fondo, desaceleración, balanceo, nieve y destellos. Por pedido del usuario, la voz propia se grabará después: «¡Jo, jo, jo! ¡Feliz Navidad!». Mientras tanto se publica con música original de campanas, celesta y cascabeles. Comienza sin sonido; **Ver con música** lo reinicia con audio. Tiene subtítulos en español que pueden ocultarse, y al terminar permanece abierto para repetirlo. Con movimiento reducido o los efectos pausados, espera a que la persona pulse reproducir. Las fuentes, prompts y el proceso de render están en [la guía del video](docs/victoria-navidad.md).

## Roadmap del videojuego

El [roadmap de animación por personaje](docs/roadmap-animacion-guardianes.md) avanza de uno en uno. El [piloto jugable de TecnoIA v2](design/characters/tecnoia/README-v2.md) está integrado en esta rama: 203 sprites, emisor visible, disparos sincronizados con simulación/sonido y celebración completa de 60 fotogramas. Incluye composición con movimiento/impacto/esquiva y recuperación ante recursos fallidos (`npm run sprites:tecnoia-game`). Los once guardianes restantes conservan v1. La [vista previa de Firebase](https://geovictoria-intranet-peru--tecnoia-v2-o55x61si.web.app/juego) está publicada hasta el 26 de noviembre de 2026; el usuario confirmó claridad y respuesta en su teléfono. Se corrigió la distribución de controles en pantallas pequeñas y se registró la [verificación móvil](docs/qa-tecnoia-v2.md). Quedan la revisión del PR y publicación de producción antes de cerrar el piloto y comenzar ConectIA; fuentes, prompts y estudios se mantienen versionados.

Los [doce guardianes por área](docs/guardianes-navidad.md) incluyen 2.208 sprites, un poder y una celebración propios. El selector permite buscar por área y probar los movimientos. Los [atlas y prompts de ImageGen](design/characters/README.md) y el exportador `npm run sprites` quedan versionados.

La [primera entrega de Pausa activa 2.0](docs/pausa-activa-2.md) ya incorpora pausa, controles consistentes, protección tras daño, esquiva, interfaz navideña y el piloto animado TecnoIA. El ranking se conserva como casual; la arena multijugador sigue pendiente.

La propuesta [VictorIA: Operación Estrella](docs/roadmap-videojuego.md) organiza la evolución desde el arcade actual: estabilidad y UX, mini historia navideña, prototipo de arena 1 vs 1, equipos pequeños y piloto hasta 5 vs 5. Incluye criterios de salida, arquitectura propuesta y decisiones de capacidad y alojamiento pendientes. Es planificación; las funciones futuras todavía no están implementadas.

El alcance contempla [doce personajes, uno por cada categoría del directorio](docs/personajes-por-area.md), con diseño, piezas y animaciones coherentes. Se plantea producir uno completo, validar tres y ampliar el elenco por tandas; las habilidades especiales se prueban por roles después del kit común.

## Concurso en vivo

El menú **Concurso en vivo** permite entrar por QR o código de sala. Desde **Administración → Concurso en vivo**, prepara siete preguntas y un bonus doble, edita las opciones y sus tiempos, abre el registro y dirige la exposición. Los aciertos suman de 7 a 497 puntos según rapidez, en múltiplos de siete; el bonus duplica el premio con el mismo tope de 497 y los totales también son múltiplos de siete. La pantalla independiente de proyección muestra los nombres en vivo, las preguntas, la clasificación entre rondas y el ganador con podio navideño. Las respuestas son únicas y el servidor valida el plazo. Se puede recuperar la participación al recargar, duplicar las preguntas para otra exposición y descargar los resultados CSV antes de archivar. [Guía de preparación y operación](docs/concurso-en-vivo.md).

## Pruebas y comprobaciones

```sh
npm test
```

Comprueba fechas de Lima, búsquedas de contenido y correos, lecturas por revisión, validación de edición, preferencias de bienvenida, calendario, asignaciones del sorteo, importación, exportación segura y manejo de errores del proveedor de correo.

Para probar las reglas se necesita Java 21 y el emulador oficial:

```sh
npx --yes firebase-tools@15.34.1 emulators:exec \
  --only firestore --project demo-geovictoria \
  --config firebase.emulator.json "npm run test:rules"
```

Para probar visualmente los flujos sin datos reales, inicia los emuladores `auth,firestore` con el mismo proyecto y ejecuta `VITE_USE_FIREBASE_EMULATORS=true npm run dev`. Este modo simula los envíos de amigo secreto sin contactar a EmailJS y solo existe durante desarrollo: la compilación de producción siempre utiliza el proyecto real.

Las pruebas rechazan ejecutarse sin `FIRESTORE_EMULATOR_HOST` y usan exclusivamente `demo-geovictoria`. Verifican lectura del buzón, permisos ordinarios/administrativos, validación de reportes, recursos públicos, ranking, denegación de colecciones no definidas, invitaciones con correo verificado, revocación inmediata y protección de la cuenta principal. La integración de GitHub ejecuta pruebas y compilación sin credenciales de producción.

## Publicación en Firebase

Tras completar la configuración administrativa, desde una sesión autorizada:

```sh
npm run build
npx firebase-tools@15.34.1 deploy --only firestore:rules,hosting
```

Los encabezados de Hosting incorporan protección de tipo de contenido, bloqueo de iframes, política de referer y caché duradera para assets con hash. La subida a GitHub no despliega Firebase automáticamente.
