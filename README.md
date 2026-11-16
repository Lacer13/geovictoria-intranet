# GeoVictoria Perú · Nuestro espacio

Intranet en React y Vite con Firestore. Incluye inicio, comunicados, directorio, vista de áreas, guías con favoritos, buzón de solicitudes, especial navideño y la pausa activa de VictorIA.

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

- Navegación inmediata; las rutas secundarias se cargan bajo demanda, sin video de espera obligatorio.
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

La contraseña administrativa incrustada en JavaScript fue eliminada. Administración utiliza Firebase Authentication y exige un token con el custom claim booleano `admin: true`.

Antes de publicar esta versión en producción, el responsable de Firebase debe:

1. Habilitar el proveedor **Correo electrónico/contraseña** en Authentication y crear o habilitar la cuenta administradora. No existe registro público de administradores.
2. Asignar `admin: true` al UID autorizado desde un entorno de confianza con Firebase Admin SDK. Nunca se asignan permisos desde el navegador ni se incluyen credenciales del servidor en el repositorio. La cuenta debe cerrar sesión y volver a entrar tras cambiar sus claims.
3. Revisar y desplegar `firestore.rules`. El bloqueo visual de una ruta no protege la base de datos por sí solo. Las reglas del repositorio no sustituyen las reglas activas hasta su despliegue.
4. Publicar Hosting después de verificar el acceso de esa cuenta.

Las reglas restringen la lectura y eliminación de reportes a administradores, validan campos y tamaños, restringen la edición de noticias/contactos y bloquean colecciones desconocidas. Noticias, contactos y ranking **siguen siendo de lectura pública**, conforme al acceso de la aplicación actual. El ranking admite puntajes enviados por clientes; no es una competencia con validación de servidor ni un sistema antifraude. Una intranet privada para todos los colaboradores requeriría añadir identidad corporativa y adaptar estas lecturas.

La configuración web de Firebase identifica el proyecto existente; no es una credencial de servidor. La protección depende de las reglas y de Authentication. No guardar archivos de cuentas de servicio en este repositorio.

## Pruebas

```sh
npm test
```

Comprueba la fecha de Lima alrededor de medianoche, el cambio de año de la cuenta regresiva, búsquedas sin acentos, almacenamiento bloqueado y exportación de calendario.

Para probar las reglas se necesita Java 21 y el emulador oficial:

```sh
npx --yes firebase-tools@15.34.1 emulators:exec \
  --only firestore --project demo-geovictoria \
  --config firebase.emulator.json "npm run test:rules"
```

Las pruebas rechazan ejecutarse sin `FIRESTORE_EMULATOR_HOST` y usan exclusivamente `demo-geovictoria`. Verifican lectura del buzón, permisos ordinarios/administrativos, validación de reportes, recursos públicos, ranking y denegación de colecciones no definidas. La integración de GitHub ejecuta pruebas y compilación sin credenciales de producción.

## Publicación en Firebase

Tras completar la configuración administrativa, desde una sesión autorizada:

```sh
npm run build
npx firebase-tools@15.34.1 deploy --only firestore:rules,hosting
```

Los encabezados de Hosting incorporan protección de tipo de contenido, bloqueo de iframes, política de referer y caché duradera para assets con hash. La subida a GitHub no despliega Firebase automáticamente.
