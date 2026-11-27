# Pausa activa y clasificaciones

La pantalla inicial reúne Aventura, Arcade, Memoria, Reflejos y Arena con una descripción breve, duración y una acción directa. La aventura y Arcade se preparan en tres pasos: nivel, guardián y alias/controles. Las animaciones, poderes, misiones y progreso existentes se conservan.

«Clasificaciones» reúne seis tablas independientes: los tres niveles, Arcade y los dos minijuegos. La portada incorpora el mismo selector, con los cinco mejores resultados y un enlace a las tablas completas de veinte. Solo se consulta la tabla seleccionada; el listener anterior se cancela al cambiar de juego o salir. Se retiró la consulta global de Arcade que se mantenía activa fuera de estas pantallas. Los empates comparten puesto; no se mezclan puntuaciones de reglas diferentes ni se presentan los alias como identidades verificadas.

Memoria y Reflejos conservan sus récords personales en el navegador. Al terminar una nueva partida se puede elegir «Publicar puntaje» con el alias visible, igual que en la aventura. Una partida usa un identificador estable: el doble clic o un reintento no genera otro registro. La clasificación del resultado destaca esa partida cuando entra en las veinte mejores. Los récords locales anteriores no se suben automáticamente. El formulario explica qué se comparte y permite reintentar un envío fallido.

Los resultados públicos de los minijuegos usan `gameLeaderboards/memory/entries` y `gameLeaderboards/aim/entries`. Las reglas añaden únicamente esos dos ámbitos al esquema existente: nombre de 2–24 caracteres, puntaje entero de 0–10.000.000 y fecha; sin campos extra, edición ni borrado por visitantes. Administración → Puntajes incluye también ambos minijuegos con el permiso `scores.manage`.

Arena conserva su marcador y ganador dentro de cada sala. Todavía no guarda una clasificación histórica; se explica en la interfaz.

La nueva interfaz requiere publicar también las reglas de los dos minijuegos para que funcionen sus tablas compartidas. La vista previa de Hosting por sí sola utiliza las reglas actuales de producción. La validación de envío y lectura se realiza exclusivamente en `demo-geovictoria`, sin puntajes de prueba en producción.

## Comprobaciones

158 pruebas generales y compilación aprobadas. Las 52 pruebas de permisos previas pasaron completas; el archivo ampliado volvió a pasar sus 28 pruebas, incluyendo creación pública de cero puntos, rechazo de edición, borrado y campos privados en ambos minijuegos, y borrado exclusivo de administración.

En la interfaz se revisaron catálogo, preparación en tres pasos, inicio/pausa/salida de una misión, resultado de Reflejos, publicación opcional con doble clic (un registro) y aparición de los mismos 15 puntos en su tabla y la portada. Se probaron el selector de seis tablas y los enlaces entre portada y clasificaciones. A 320×568, catálogo, portada y tablas tienen el mismo ancho de contenido y desplazamiento: 305 píxeles, sin desbordamiento horizontal. La revisión de escritorio fue a 1280×800. Se restableció la vista al terminar. Falta probar la comodidad en un teléfono físico.

[Catálogo](../design/pausa-ui/catalogo-desktop.jpg) · [Catálogo móvil](../design/pausa-ui/catalogo-320.jpg) · [Ranking de portada](../design/pausa-ui/portada-ranking-320.jpg) · [Tabla completa](../design/pausa-ui/ranking-320.jpg) · [Vista previa y hashes](releases/pausa-rankings-preview-2026-11-27.json).
