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

- Navegación inmediata; las rutas secundarias se cargan bajo demanda. VictorIA recibe al equipo con un saludo navideño de 12 segundos al abrir el inicio una vez por sesión. Se puede saltar, pausar, avanzar y repetir desde la tarjeta **Ver video de VictorIA** del inicio o el botón **Video de VictorIA** del menú de cualquier sección. Las invitaciones privadas y Administración abren directamente.
- Paleta navideña de rojo y blanco: superficies claras, menú carmesí, botones y detalles rojos, con una variante oscura en tonos carbón y granate.
- Búsqueda global: personas disponibles, secciones y guías. Atajo `Ctrl + K` / `⌘ + K`.
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

**Configurar correo** guía la conexión de Gmail u Outlook mediante EmailJS e incluye la plantilla HTML para copiar. No requiere dominio propio ni cambiar el plan de Firebase. La conexión de la cuenta y la autorización del proveedor las realiza su titular; la aplicación no incluye una cuenta de envío preconfigurada ni solicita contraseñas SMTP. Solo se guardan los tres identificadores públicos de EmailJS en una colección accesible a administradores.

El panel registra cada intento y permite consultar el respaldo, descargarlo o recuperar el enlace privado de una persona. Los correos requieren confirmación del administrador; guardar o sortear no los envía. Consulta [la guía de configuración y operación](docs/amigo-secreto.md).

La preparación separa los detalles del intercambio y las personas. Señala correos incompletos o repetidos y avisa antes de descartar cambios al cambiar de sorteo. La entrega tiene un resumen, progreso y filtros por pendientes, aceptados y envíos que requieren revisión. Los participantes pueden pegar su enlace desde la página pública para abrir su invitación.

La bienvenida anima varias escenas completas de VictorIA, con su cabeza y manos flotantes, saludo y guiño en el trineo navideño. Las poses se generan completas para conservar la palma, los dedos y el rostro; no se recorta al personaje del video de estudio. La música es una composición instrumental de campanas, celesta y cascabeles creada para el video. Comienza sin sonido; **Ver con música** lo reinicia con audio. Al terminar permanece abierto para repetirlo. Con movimiento reducido o los efectos pausados, espera a que la persona pulse reproducir. Las fuentes, prompts y el proceso de render están en [la guía del video](docs/victoria-navidad.md).

## Pruebas

```sh
npm test
```

Comprueba fechas de Lima, búsquedas, preferencias, calendario, asignaciones del sorteo, importación, exportación segura y manejo de errores del proveedor de correo.

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
