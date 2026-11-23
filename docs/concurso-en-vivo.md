# Concurso navideño en vivo · Tickets de implementación

## Preparar la exposición

1. Abre **Administración → Concurso en vivo** o `/admin?seccion=concurso` con tu cuenta autorizada.
2. Pulsa **Nuevo concurso**. El título empieza como «Tickets de implementación · Reto navideño» y puedes cambiarlo.
3. Elige la **Cantidad de preguntas**, de **1 a 10**, incluido el bonus. En cada pregunta selecciona **Alternativas de esta pregunta**, de **2 a 6**, y marca una respuesta correcta. El tiempo sigue siendo editable de 10 a 90 segundos. La última pregunta siempre es el **Bonus ×2**; un concurso de una sola pregunta consiste en el bonus.
4. Puedes guardar un borrador incompleto y continuar otro día. El indicador muestra cuántas preguntas están listas. Para abrir el registro, todas las preguntas elegidas deben estar completas, con alternativas diferentes, respuesta correcta y cambios guardados.
5. Pulsa **Abrir registro**. Desde ese momento se fijan las preguntas. Para corregirlas o repetir la exposición, usa **Duplicar guardado**: obtendrás un borrador nuevo con otro código y sin participantes ni puntajes anteriores.

Al aumentar la cantidad se conservan los textos y se agregan campos vacíos. Al reducir preguntas se pide confirmación antes de quitar las últimas; la última que queda pasa a ser el bonus. Al reducir alternativas se pide confirmación y se desmarca la respuesta correcta si quedó fuera de la lista. Nada se publica hasta guardar.

El valor inicial continúa siendo ocho preguntas y cuatro alternativas. Los concursos guardados y las salas antiguas sin contador de preguntas conservan su formato de ocho.

No se incluyen preguntas supuestamente oficiales del módulo: el contenido real lo añade el expositor. Las preguntas del ensayo de desarrollo se crearon solo en el emulador local y no se publican en producción.

## Compartir y proyectar

- **Abrir pantalla para proyectar** abre una página independiente, sin el menú de la intranet ni los controles de administración. Puedes usar **Pantalla completa** y salir con Escape del navegador.
- La pantalla de espera incluye QR, código de ocho caracteres y nombres que aparecen en vivo al registrarse. También puedes copiar el enlace de ingreso.
- Cada participante abre el enlace, escribe su nombre y conserva el mismo navegador durante el concurso. No necesita correo ni cuenta. El formulario avisa que su nombre y puntaje aparecerán en la pantalla.
- Se admiten hasta 200 participantes. Un nombre ya registrado, sin distinguir mayúsculas, no puede usarse de nuevo. Si hay homónimos, deben añadir el apellido u otra distinción.
- El registro cierra al iniciar la primera pregunta. Los participantes ya inscritos pueden recuperar su lugar recargando desde el mismo navegador; quienes lleguen después pueden seguir la pantalla pública.

## Dirigir la competencia

1. Cuando el equipo esté listo, pulsa **Iniciar pregunta 1**. La pregunta y sus alternativas aparecen simultáneamente en la proyección y los celulares.
2. Cada persona toca una opción para enviar su única respuesta. «Respuesta guardada» significa que el servidor confirmó el envío. La elección se conserva al recargar.
3. El contador del presentador muestra cuántas respuestas se recibieron. El tiempo de respuesta lo valida el servidor, no el reloj del celular.
4. Pulsa **Cerrar y revelar respuesta**. Si todavía queda tiempo, aparece una confirmación antes de cerrar. Al llegar a cero, el servidor ya rechaza respuestas; el presentador sigue controlando cuándo se revela y avanza.
5. Se muestra la respuesta correcta, el reparto de respuestas y los puntos de cada participante en su celular. Pulsa **Ver clasificación** para mostrar la tabla a todos.
6. Inicia la siguiente pregunta y repite. Al llegar a la última pregunta aparece **Lanzar bonus doble**.
7. Cierra el bonus, muestra la clasificación y pulsa **Revelar ganador**: aparecen el nombre, la corona, el podio y el confeti navideño.

Si se pierde la conexión al cerrar una pregunta, la sala puede permanecer en «Cerrando». **Completar cierre** retoma el cálculo; las respuestas aceptadas permanecen guardadas y no se suman dos veces. Recargar Administración permite retomar el estado compartido. Si dos presentadores intentan avanzar a la vez, las transacciones comprueban el estado y evitan saltar preguntas.

## Puntaje y empates

- Correcta: `7 × máximo(1, redondear(71 × (1 − milisegundos / tiempo disponible en milisegundos)))`. Cuanto más rápida, más puntos.
- El rango solicitado de 1 a 500 se concreta en **7 a 497**, los múltiplos de siete que caben en ese intervalo. Ejemplos en una pregunta de 30 segundos: al inicio, 497; a los 15 segundos, 252; justo antes de cerrar, 7.
- Bonus: multiplica el resultado por dos con **tope de 497**, de **14 a 497** puntos, también múltiplos de siete. Por ejemplo, 126 se convierte en 252; 252 se convierte en 497 por el tope.
- La clasificación y el CSV suman los premios sin redondeos adicionales. El máximo total es **497 × cantidad de preguntas**: 3976 puntos en el formato inicial de ocho y 4970 en uno de diez.
- Incorrecta, ausente o fuera de plazo: cero puntos.
- Desempate: más aciertos, después menos tiempo acumulado en respuestas correctas. Una igualdad exacta conserva una posición compartida y se anuncia como empate en la cima.

La rapidez se mide al llegar la respuesta al servidor. La latencia de la red influye; conviene que todos tengan una conexión estable. Una respuesta no puede modificarse ni recibir un tiempo o puntaje enviado por el participante.

Al cerrar cada pregunta se recalculan los premios de las rondas anteriores a partir de su tiempo y acierto guardados, para que una partida reanudada tampoco mezcle escalas en el nuevo total. Los resultados ya publicados de partidas finalizadas se conservan; esta actualización no modifica registros de producción de forma retroactiva.

## Resultados y cierre

Desde la primera clasificación puedes descargar **Resultados CSV** con posición, nombre, puntos, aciertos y segundos acumulados en aciertos. El CSV protege los nombres que podrían interpretarse como fórmulas.

La clasificación final permanece disponible hasta archivar. **Descarga el CSV antes de archivar**: archivar cierra el enlace público y retira los nombres y puntajes de esa vista. Las preguntas siguen disponibles en Administración para duplicarlas. Los registros de rondas y respuestas permanecen privados para administradores en Firestore; esta versión no ofrece una pantalla de consulta histórica de las respuestas individuales después de archivar.

## Datos y permisos

- `quizEvents/{code}`: título, preguntas, respuestas correctas y revisión. Solo administradores.
- `quizRooms/{code}`: estado público de la sala, cantidad de preguntas y pregunta actual, sin clave de respuesta mientras esté abierta. La clasificación solo la publica un administrador.
- `players`: nombre y fecha de registro públicos dentro de una sala activa.
- `credentials`: capacidad privada de 256 bits del participante; no aparece en el QR, la dirección de la página ni la lista de nombres.
- `names` y `stats/registration`: reserva atómica de nombre y cupo, con límite verificado por reglas.
- `rounds`: pregunta, respuesta correcta y resultado de cada ronda. Solo administradores.
- `rounds/{index}/answers/{token}`: elección y fecha de recepción del servidor. Solo admite creación, una vez, con la capacidad correcta y dentro del plazo. No se permite listar respuestas públicamente; el participante recupera únicamente su documento mediante la capacidad guardada en su navegador.

No se activa autenticación anónima, no se crea un proveedor nuevo y no se cambian los permisos de los módulos existentes. Es una dinámica interna de participación por nombre, sin verificación de identidad empresarial: una persona con otro navegador y otro nombre podría registrarse de nuevo durante el registro. No se presenta como un examen supervisado.

Las reglas usan escrituras atómicas y `getAfter` para validar que nombre, participante, capacidad y cupo se reservan juntos. Referencias: [condiciones de seguridad de Firestore](https://firebase.google.com/docs/firestore/security/rules-conditions), [transacciones y lotes atómicos](https://firebase.google.com/docs/firestore/manage-data/transactions).

## Validación

El conjunto completo suma 110 pruebas del portal y 34 de reglas, incluidas pruebas específicas del concurso. Cubre opciones incompletas/repetidas, bonus, cierre anticipado, desempate, recuperación, registros parciales, nombre repetido, límite de 200, capacidades incorrectas, lectura de claves privadas, modificación de respuestas, tiempo falsificado, puntaje falsificado, respuesta futura/tardía y archivo.

El ensayo original de navegador utiliza `demo-geovictoria`, con presentador ficticio y preguntas identificadas como ENSAYO. En ese formato se verificaron edición y guardado de las ocho preguntas, apertura y QR, registro en vivo, respuesta única, recuperación al recargar, recorrido de las ocho preguntas, error sin puntos, bonus doble y ganador.

Comandos habituales: `npm test`, `npm run test:rules` con Firestore Emulator y `npm run build`. Las pruebas de reglas se ejecutan en serie; la primera limpia únicamente el proyecto demo del emulador antes de cargar las fixtures.

Para aislar el ensayo de otros emuladores se admiten puertos locales configurables, solo en desarrollo:

```sh
VITE_USE_FIREBASE_EMULATORS=true VITE_FIRESTORE_EMULATOR_PORT=8288 VITE_AUTH_EMULATOR_PORT=9199 npm run dev -- --host 127.0.0.1 --port 5185
```

Los puertos predeterminados siguen siendo 8188 y 9099. La compilación de producción elimina el modo demo.

## Preguntas y alternativas configurables · 23 de noviembre de 2026

El editor, presentador, participantes, proyección, conteo de respuestas, bonus y denominador de aciertos usan la cantidad guardada. Las reglas conservan acceso administrativo al contenido privado, bloqueo al abrir el registro, respuesta única por capacidad, comprobación de plazo en servidor y rechazo de alternativas fuera de la pregunta actual.

El rango final de 1–10 permite mantener la validación de todas las preguntas dentro del límite de evaluación de Firestore. Se reutilizan los campos de cada pregunta durante la validación y se valida el texto con una expresión que admite saltos de línea y Unicode. Las lecturas de los cuatro campos obligatorios y el tamaño de cuatro claves rechazan campos faltantes o adicionales. No se amplía el acceso público a las preguntas futuras o sus respuestas correctas.

Pruebas: 110 del portal y 34 de permisos; compilación de producción. El ensayo en emulador comprobó cambiar 3 → 10 → 3 preguntas, la confirmación al reducir y la desmarcación de una alternativa correcta eliminada; guardar y abrir una sala con 2, 3 y 6 alternativas; registro, acierto, error sin puntos, bonus F y ganador con 966 puntos y 2/3 aciertos. Se revisaron editor y seis alternativas a 375 × 812 sin desbordamiento horizontal. No se crearon concursos de ejemplo en producción.

Capturas con datos ficticios: [editor](../design/concurso/2026-11-23/editor.jpg), [editor móvil](../design/concurso/2026-11-23/editor-movil.jpg), [seis alternativas en móvil](../design/concurso/2026-11-23/seis-alternativas-movil.jpg).

La publicación debe desplegar las reglas compatibles y el frontend validado como una misma entrega. Hasta entonces, la vista previa permite revisar la interfaz; los nuevos tamaños requieren las reglas de esta rama para guardarse.

También se comprobó que un administrador autorizado por correo verificado puede crear, editar y abrir un concurso de diez preguntas y seis alternativas. La consulta de autorización conserva el requisito de registro activo con rol `owner` o `admin`; se evita repetir la lectura del mismo documento.

[Vista previa del editor](https://geovictoria-intranet-peru--quiz-config-iqgj13i5.web.app/admin?seccion=concurso), disponible hasta el 30 de noviembre. [Registro de verificación](releases/quiz-config-preview-2026-11-23.json).
