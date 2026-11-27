# Resultados centrados y foco de títulos

La pantalla final de aventura y arcade muestra una tarjeta centrada de hasta 1040 píxeles, con un retrato más pequeño, el resultado y las acciones para volver a jugar antes del formulario de publicación. La clasificación está detrás de «Ver clasificación de…», para consultar la tabla sin desplazar las acciones principales. Si se publica correctamente un puntaje, la clasificación se despliega automáticamente. Publicar sigue siendo opcional.

Se elimina la regla global que forzaba todos los `h3` del juego a 24–64 píxeles con `!important`. Cada componente vuelve a controlar su tipografía; el título del nivel en el ranking mide 18 píxeles y se alinea a la izquierda. Esto también corrige los rankings compartidos de los minijuegos.

Los títulos que reciben foco programático conservan ese foco para anunciar el cambio de pantalla, pero ya no dibujan un recuadro sobre el texto. Los botones, campos y controles conservan sus indicadores de foco con teclado. Al mostrar el resultado se vuelve al inicio de la página para evitar heredar un desplazamiento previo.

## Verificación integrada

- Se terminó un intento real de arcade en la vista previa y se revisó la pantalla final a 1280×600, 1366×768 y 320×568. A 1366×768, el documento mide exactamente el viewport y la tarjeta queda completamente visible y centrada. A 1280×600, toda la tarjeta principal queda visible; el documento incluye 12 píxeles adicionales de margen inferior.
- La clasificación abre y cierra correctamente, carga su estado vacío y conserva el título a 18 píxeles. Al abrir tablas largas y en teléfonos se permite el desplazamiento vertical natural, sin desbordamiento horizontal ni recortes de contenido.
- Se comprobó el foco del título sin borde y Tab hasta «Jugar otra vez», que conserva un indicador visible. El botón «Publicar puntaje» mantiene una sola línea en escritorio y los campos se apilan en teléfono.
- Compilación aprobada, sin errores de consola y hashes de Hosting verificados. No se publicaron puntajes de prueba; la apertura automática posterior a publicar no se ejercitó contra producción. Falta valoración en un teléfono físico.

El registro de vista previa incluye medidas y hashes. No cambia la simulación ni las reglas de Firestore.
