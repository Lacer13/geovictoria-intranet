# Estructura y revisión del código

Revisión del 25 de noviembre de 2026. Se mantuvo React/Vite con Firebase como una aplicación desplegable y se separaron responsabilidades dentro del código. No se añadieron servicios distribuidos que la operación actual no necesita.

## Separaciones realizadas

| Bloque                       | Antes, en HEAD de referencia                                             | Organización actual                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Administración               | `Admin.jsx`, 647 líneas con autenticación, lecturas, navegación y vistas | Coordinador de 117 líneas; sesión, permisos, navegación, datos y pantallas en `src/admin/`                                                      |
| Amigo secreto administrativo | `SecretSantaAdmin.jsx`, 1.845 líneas                                     | Entrada de compatibilidad; coordinador, borrador, consulta, resultados, panel de correo, configuración y pasos en `src/components/secretSanta/` |
| Concurso administrativo      | `QuizAdmin.jsx`, 922 líneas                                              | Entrada de compatibilidad; coordinador, editor, presentación y etiquetas en `src/components/quizAdmin/`                                         |
| Estilos globales             | `index.css`, 8.029 líneas                                                | Entrada de 22 líneas que importa 21 archivos por área, en el mismo orden                                                                        |

Las cantidades anteriores corresponden al commit base `11fc01a`, no a un umbral de calidad. Los coordinadores delegan las vistas; los módulos pueden seguir teniendo varios cientos de líneas cuando describen una responsabilidad coherente.

La separación del CSS fue mecánica: concatenar los 21 archivos produce exactamente el contenido anterior, incluido el orden de la cascada. SHA-256 antes y después: `9406d50037bff143138d7b915845cab564f7377f7436755024b2120854b3ecb1`. Los nuevos estilos de acceso están aislados en `src/admin/admin-access.css`.

## Responsabilidades

- `src/admin/permissions.js`: catálogo, dependencias, plantillas y resolución pura de acceso.
- `src/admin/useAdminAccess.js`: identidad y escucha de autorización/perfil, sin formularios ni escrituras de contenido.
- `src/admin/accessStore.js`: transacciones para perfiles y autorizaciones.
- `src/admin/access/`: personas, perfiles y sus editores; carga conjunta de sus directorios.
- `src/admin/modules.js` y `AdminNavigation.jsx`: metadatos y navegación de módulos permitidos.
- `src/admin/useAdminCollection.js`: escucha, estados de carga/error y reintento para una colección de la sección activa.
- `ReportsSection`, `ContentSection` y `ScoresSection`: vistas de cada área. Ya no se cargan todos los datos administrativos al iniciar sesión.
- `src/components/secretSanta/`: preparación, entrega, consulta y configuración separadas. `src/lib/secretSantaRoster.js` contiene la validación pura de la lista; las operaciones de datos siguen en los módulos `src/lib/secretSanta*`.
- `src/components/quizAdmin/`: editor y conducción separados del coordinador. La presentación comprueba `quiz.manage` antes de suscribirse al evento privado.
- `src/game/`, `src/lib/` y `server/arena.mjs`: conservan sus límites existentes de simulación, lógica reutilizable y servidor de partidas.
- `firestore.rules`: autorización del servidor y validación de documentos. Firebase exige un único archivo de reglas de despliegue; sus funciones compartidas evitan duplicar la resolución de permisos.

Los módulos administrativos se importan bajo demanda y se desmontan al cambiar los permisos. `components/AdminManagers.jsx`, `SecretSantaAdmin.jsx` y `QuizAdmin.jsx` siguen como entradas de compatibilidad para evitar romper las importaciones existentes.

## Alcance y seguimiento

Se inspeccionaron los archivos de `src/` y los puntos de autorización. La concentración principal estaba en Administración, Amigo secreto y la hoja global; esos bloques se separaron en esta entrega. El videojuego ya distingue presentación, simulación, personajes y red.

Persisten archivos grandes dentro de un dominio, como `ActiveBreak.jsx`, `Quiz.jsx` y las hojas específicas del concurso y del arcade. Su tamaño por sí solo no demuestra un problema de arquitectura. Si crecen esas funciones, conviene extraer sus paneles y comportamiento por responsabilidad y continuar retirando reglas CSS antiguas de forma gradual. Esta revisión no afirma una reescritura completa de cada pantalla.

## Verificación

Se incorporaron pruebas unitarias del catálogo y resolución de acceso, y pruebas de reglas para perfiles, acciones independientes, revocación, delegación y límites máximos. El concurso conserva diez preguntas de hasta cinco opciones, con tiempos enteros de 10 a 90 segundos; la validación se compactó sin ampliar esos límites para dejar margen a la evaluación de permisos de Firestore.

La revisión de interfaz utilizó cuentas y datos ficticios en emuladores, en escritorio de 1.440 px y móvil de 390 px. Cubrió crear perfiles desde plantilla y con permisos personalizados, asignar y reasignar personas, editar y confirmar perfiles, duplicar y proteger cambios sin guardar, cambios de permisos en sesión abierta y bloqueo/restauración del acceso. Las capturas están en `design/admin-access/2026-11-25/`.

Los perfiles y esta separación de módulos se publicaron el 26 de noviembre de 2026, junto con la tabla rápida de parejas y el primer ingreso con contraseña propia. El [registro de producción](releases/perfiles-parejas-production-2026-11-26.json) identifica el código, las reglas y los recursos publicados. El registro del 25 de noviembre conserva la publicación anterior de la experiencia de Amigo secreto.

Resultado final: 116 pruebas generales y 49 pruebas de reglas aprobadas; compilación correcta y lint sin advertencias en los archivos nuevos o modificados. El lint del repositorio conserva tres advertencias anteriores por parámetros sin uso en `tests/quiz.test.js`. El [registro de validación](reviews/perfiles-arquitectura-2026-11-25.json) contiene los hashes y el alcance de las comprobaciones. El build de producción no contiene las cuentas, identificadores de proyecto ni credenciales ficticias del emulador.

La ampliación del 26 de noviembre agrega `SantaPairingsTable.jsx`, `src/lib/santaPairings.js` y `src/santa-pairings.css` como módulo de consulta masiva independiente. El primer ingreso está en `PasswordSetup.jsx`, `passwordStatus.js` y `src/lib/adminPassword.js`. Pasaron 120 pruebas generales y 50 de reglas, más una prueba de integración local con Authentication que comprueba rechazo de la contraseña anterior y aceptación de la nueva. Se verificaron los hashes de los 60 recursos JS/CSS/HTML publicados y cinco rutas, sin crear sorteos reales ni enviar invitaciones.
