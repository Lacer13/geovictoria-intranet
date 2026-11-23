# Concurso navideño en vivo · Tickets de implementación

## Preparar la exposición

1. Abre **Administración → Concurso en vivo** o `/admin?seccion=concurso` con tu cuenta autorizada.
2. Pulsa **Nuevo concurso**. El título empieza como «Tickets de implementación · Reto navideño» y puedes cambiarlo.
3. Elige la **Cantidad de preguntas**, de **1 a 10**, incluido el bonus. En cada pregunta selecciona **Alternativas de esta pregunta**, de **2 a 5**, y marca una respuesta correcta. El tiempo sigue siendo editable de 10 a 90 segundos. La última pregunta siempre es el **Bonus ×2**; un concurso de una sola pregunta consiste en el bonus.
4. Puedes guardar un borrador incompleto y continuar otro día. El indicador muestra cuántas preguntas están listas. Para abrir el registro, todas las preguntas elegidas deben estar completas, con alternativas diferentes, respuesta correcta y cambios guardados.
5. Pulsa **Abrir registro**. Desde ese momento se fijan las preguntas. Para corregirlas o repetir la exposición, usa **Duplicar guardado**: obtendrás un borrador nuevo con otro código y sin participantes ni puntajes anteriores.

Al aumentar la cantidad se conservan los textos y se agregan campos vacíos. Al reducir preguntas se pide confirmación antes de quitar las últimas; la última que queda pasa a ser el bonus. Al reducir alternativas se pide confirmación y se desmarca la respuesta correcta si quedó fuera de la lista. Nada se publica hasta guardar.

El valor inicial continúa siendo ocho preguntas y cuatro alternativas. Los concursos guardados y las salas antiguas sin contador de preguntas conservan su formato de ocho.

No se incluyen preguntas supuestamente oficiales del módulo: el contenido real lo añade el expositor. Las preguntas del ensayo de desarrollo se crearon solo en el emulador local y no se publican en producción.

## Compartir y proyectar

- **Abrir pantalla para proyectar** abre una página independiente, sin el menú de la intranet; si el navegador tiene una sesión administrativa autorizada, incluye los controles del presentador. Puedes usar **Pantalla completa** y salir con Escape del navegador.
- La pantalla de espera incluye QR, código de ocho caracteres y nombres que aparecen en vivo al registrarse. También puedes copiar el enlace de ingreso.
- Cada participante abre el enlace, escribe su nombre y conserva el mismo navegador durante el concurso. No necesita correo ni cuenta. El formulario avisa que su nombre y puntaje aparecerán en la pantalla.
- Se admiten hasta 200 participantes. Un nombre ya registrado, sin distinguir mayúsculas, no puede usarse de nuevo. Si hay homónimos, deben añadir el apellido u otra distinción.
- El registro cierra al iniciar la primera pregunta. Los participantes ya inscritos pueden recuperar su lugar recargando desde el mismo navegador; quienes lleguen después pueden seguir la pantalla pública.

## Dirigir la competencia

1. Cuando el equipo esté listo, pulsa **Iniciar pregunta 1**. La pregunta y sus alternativas aparecen simultáneamente en la proyección y los celulares.
2. Cada persona selecciona una alternativa y pulsa **Enviar respuesta**. Puede cambiar su elección antes de enviar. Seleccionar no guarda ni detiene el tiempo; el servidor registra el instante en que recibe el envío y solo acepta una respuesta por pregunta.
3. Después aparece **Respuesta recibida**, el tiempo empleado y la espera hasta que termine el contador. La respuesta correcta y los puntos de esa ronda permanecen ocultos durante la pregunta. «Recibida» significa que el servidor confirmó el envío; la elección enviada se conserva al recargar.
4. **Mantén abierto el panel del presentador**. Al llegar el contador a cero, completa el cierre automáticamente y publica una misma actualización de resultados para participantes y proyección. Si el panel se cerró o perdió la conexión, vuelve a abrirlo para completar el cierre. El servidor rechaza envíos fuera del plazo. Se conserva **Cerrar pregunta y ver puntos** para un cierre anticipado con confirmación.
5. La pantalla entre preguntas muestra la respuesta correcta, el reparto de respuestas desplegable, quién lidera y la clasificación. Cada fila muestra **+puntos de esta ronda**, el total que aumenta suavemente y las posiciones ganadas. El participante ve además su suma anterior + premio = total. Los efectos respetan movimiento reducido y la decoración quieta.
6. Pulsa **Siguiente pregunta** cuando el equipo termine de revisar los resultados. El botón incluye el número siguiente y señala cuándo empieza el bonus. No avanza automáticamente ni salta esta pausa.
7. Después del bonus, pulsa **Revelar ganador**: aparecen el nombre, la corona, el podio y el confeti navideño.

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

El conjunto completo suma 111 pruebas del portal y 34 de reglas, incluidas pruebas específicas del concurso. Cubre opciones incompletas/repetidas, bonus, cierre anticipado, desempate, recuperación, registros parciales, nombre repetido, límite de 200, capacidades incorrectas, lectura de claves privadas, modificación de respuestas, tiempo falsificado, puntaje falsificado, respuesta futura/tardía y archivo.

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

Publicado el 23 de noviembre con autorización del usuario: [PR #7](https://github.com/Lacer13/geovictoria-intranet/pull/7) fusionado en `main`, interfaz y reglas de Firestore desplegadas. [Administrar concurso](https://geovictoria-intranet-peru.web.app/admin?seccion=concurso). Las 110 pruebas del portal, 34 de permisos y la compilación pasaron también en [GitHub Actions de main](https://github.com/Lacer13/geovictoria-intranet/actions/runs/45245153028).

También se comprobó que un administrador autorizado por correo verificado puede crear, editar y abrir un concurso de diez preguntas y seis alternativas. La consulta de autorización conserva el requisito de registro activo con rol `owner` o `admin`; se evita repetir la lectura del mismo documento.

[Vista previa del editor](https://geovictoria-intranet-peru--quiz-config-iqgj13i5.web.app/admin?seccion=concurso), disponible hasta el 30 de noviembre. [Registro de verificación](releases/quiz-config-preview-2026-11-23.json).

Se promovió la versión inmutable `1d9d565bffa2e499` de la vista previa aprobada. Se verificaron los hashes de 20 recursos, seis rutas del portal y la coincidencia de las reglas publicadas con la fuente probada. La entrada pública muestra «Preguntas a medida» y el enlace de administración. [Registro de producción y reversión](releases/quiz-config-production-2026-11-23.json) · [Captura de producción](../design/concurso/2026-11-23/produccion.jpg).

## Ajuste del máximo de alternativas · 23 de noviembre de 2026

El rango vigente es de **2 a 5 alternativas (A–E)** por pregunta, con **1–10 preguntas**. El selector, la validación del borrador y las reglas de Firestore aplican el mismo límite. Se conserva el bonus en la última pregunta y toda la lógica de tiempos, puntajes, clasificación y CSV. Las referencias a seis alternativas de la entrega anterior describen su validación histórica.

La revisión del ajuste comprobó el selector con solo 2, 3, 4 y 5 alternativas; un borrador ficticio anterior con seis conserva su contenido hasta confirmar la reducción a cinco, desmarca F y permite guardar tras marcar E. [Captura del ensayo con cinco alternativas](../design/concurso/2026-11-23/cinco-alternativas.jpg). Se aprobaron las 110 pruebas del portal, las 34 de permisos y la compilación.

Publicado con autorización del usuario: [PR #8](https://github.com/Lacer13/geovictoria-intranet/pull/8) fusionado y versión `f5ad08a32a07ff10` desplegada con las reglas compatibles. Se verificaron 20 recursos por SHA-256 y seis rutas del portal. [Administrar concurso](https://geovictoria-intranet-peru.web.app/admin?seccion=concurso) · [Registro de publicación y reversión](releases/quiz-five-production-2026-11-23.json).

## Envío, espera y resultados entre preguntas · 23 de noviembre de 2026

Se separan selección y envío. Todos esperan al cierre compartido antes de ver la respuesta correcta y el premio. El panel del presentador cierra automáticamente al terminar el contador y muestra directamente la clasificación; el botón «Siguiente pregunta» controla el avance. Los premios por ronda y las posiciones anteriores se calculan a partir de las rondas guardadas sin cambiar la fórmula, el bonus, los desempates ni el CSV.

Validación: 111 pruebas del portal, 34 de permisos y compilación. En un ensayo local de tres preguntas con dos participantes se comprobó cambiar de alternativa antes de enviar, la respuesta única confirmada, la espera sin revelar puntos, tres cierres automáticos, el reinicio de la selección, avance y bonus, cambio de líder y ganador. Ana terminó con 581 puntos y 2/3 aciertos; Ben, con 455 puntos. La clasificación móvil se revisó a 375 × 812 sin desbordamiento horizontal. No se usaron participantes ni concursos reales. [Captura de la espera](../design/concurso/2026-11-23/respuesta-en-espera.jpg).

Publicado: [PR #9](https://github.com/Lacer13/geovictoria-intranet/pull/9) fusionado, GitHub Actions aprobado y versión `2df6f42cc48d874d` desplegada. Se verificaron 20 recursos por SHA-256, seis rutas y la conservación de las reglas de Firestore. [Administrar concurso](https://geovictoria-intranet-peru.web.app/admin?seccion=concurso) · [Registro de publicación y reversión](releases/quiz-flow-production-2026-11-23.json).

## Controles en la presentación y reutilización del mismo concurso

La pantalla para proyectar permite iniciar, cerrar y ver resultados, pasar a la siguiente pregunta y revelar al ganador cuando el presentador tiene una sesión administrativa autorizada en el mismo navegador. Para los demás sigue siendo una vista pública sin controles ni acceso a las preguntas privadas.

En Administración → Concurso en vivo, **Reiniciar este concurso** conserva título, preguntas, código y QR. Tras confirmar, cierra la sala y borra participantes, reservas de nombres, credenciales, rondas, respuestas y puntajes. Descarga antes el CSV si lo necesitas. Después vuelve a ser un borrador: pulsa **Abrir registro** y podrán ingresar de nuevo con el mismo enlace. Si se interrumpe la limpieza, la sala queda archivada y se puede reintentar el reinicio. Solo administradores pueden limpiar datos y únicamente con la sala archivada.

Comprobado con 111 pruebas del portal, 35 de permisos y compilación. La prueba de reinicio verifica el bloqueo de borrado en una partida activa, rechazo de visitantes, limpieza con la sala archivada, conservación de preguntas, reapertura del mismo código y nuevo registro.
