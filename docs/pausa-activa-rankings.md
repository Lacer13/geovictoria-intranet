# Pausa activa y clasificaciones

**Publicado el 27 de noviembre de 2026:** el PR #16 está fusionado y la versión `865d7ffa56b461af` está activa en [Pausa activa](https://geovictoria-intranet-peru.web.app/juego) y [la portada](https://geovictoria-intranet-peru.web.app/), junto con las reglas de los dos minijuegos. Se verificaron 70 recursos por SHA-256 y la lectura pública de ambas tablas y su selector en portada, sin errores de consola ni puntajes de prueba en producción. [Registro de publicación](releases/pausa-rankings-production-2026-11-27.json). Si una pestaña conserva la interfaz anterior, recargarla recupera la versión nueva.

La pantalla inicial reúne Aventura, Arcade, Memoria, Reflejos y Arena con una descripción breve, duración y una acción directa. La aventura y Arcade se preparan en tres pasos: nivel, guardián y alias/controles. Las animaciones, poderes, misiones y progreso existentes se conservan.

«Clasificaciones» reúne seis tablas independientes: los tres niveles, Arcade y los dos minijuegos. La portada incorpora el mismo selector, con los cinco mejores resultados y un enlace a las tablas completas de veinte. Solo se consulta la tabla seleccionada; el listener anterior se cancela al cambiar de juego o salir. Se retiró la consulta global de Arcade que se mantenía activa fuera de estas pantallas. Los empates comparten puesto; no se mezclan puntuaciones de reglas diferentes ni se presentan los alias como identidades verificadas.

Memoria y Reflejos conservan sus récords personales en el navegador. Al terminar una nueva partida se puede elegir «Publicar puntaje» con el alias visible, igual que en la aventura. Una partida usa un identificador estable: el doble clic o un reintento no genera otro registro. La clasificación del resultado destaca esa partida cuando entra en las veinte mejores. Los récords locales anteriores no se suben automáticamente. El formulario explica qué se comparte y permite reintentar un envío fallido.

Los resultados públicos de los minijuegos usan `gameLeaderboards/memory/entries` y `gameLeaderboards/aim/entries`. Las reglas añaden únicamente esos dos ámbitos al esquema existente: nombre de 2–24 caracteres, puntaje entero de 0–10.000.000 y fecha; sin campos extra, edición ni borrado por visitantes. Administración → Puntajes incluye también ambos minijuegos con el permiso `scores.manage`.

Arena conserva su marcador y ganador dentro de cada sala. Todavía no guarda una clasificación histórica; se explica en la interfaz.

La interfaz y las reglas de los dos minijuegos se publicaron juntas. La vista previa de Hosting comparte las reglas de producción. La validación de envío se realizó exclusivamente en `demo-geovictoria`; en producción se verificó la lectura sin crear puntajes de prueba.

## Comprobaciones

158 pruebas generales, 53 de permisos y compilación aprobadas en GitHub Actions. Las pruebas incluyen creación pública de cero puntos, rechazo de edición, borrado y campos privados en ambos minijuegos, y borrado exclusivo de administración.

En la interfaz se revisaron catálogo, preparación en tres pasos, inicio/pausa/salida de una misión, resultado de Reflejos, publicación opcional con doble clic (un registro) y aparición de los mismos 15 puntos en su tabla y la portada. Se probaron el selector de seis tablas y los enlaces entre portada y clasificaciones. A 320×568, catálogo, portada y tablas tienen el mismo ancho de contenido y desplazamiento: 305 píxeles, sin desbordamiento horizontal. La revisión de escritorio fue a 1280×800. Se restableció la vista al terminar. Falta probar la comodidad en un teléfono físico.

[Catálogo](../design/pausa-ui/catalogo-desktop.jpg) · [Catálogo móvil](../design/pausa-ui/catalogo-320.jpg) · [Ranking de portada](../design/pausa-ui/portada-ranking-320.jpg) · [Tabla completa](../design/pausa-ui/ranking-320.jpg) · [Vista previa y hashes](releases/pausa-rankings-preview-2026-11-27.json).
