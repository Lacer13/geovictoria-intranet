# Partida centrada en pantalla

Durante la aventura y el arcade individual, el escenario, las vidas, el puntaje, la pausa y los controles caben en la altura visible de la ventana. Antes, el escenario calculaba su altura a partir del ancho y el resto de la interfaz podía quedar fuera de pantalla.

La clase `solo-session` activa una distribución que ocupa el viewport dinámico y respeta las áreas seguras del teléfono. La cabecera del portal se oculta durante la partida y vuelve al terminar o regresar a la preparación. El espacio disponible para el escenario se calcula después de reservar el espacio real de las barras y controles; el canvas conserva 16:9 y se centra sin recortar ni deformar. En teléfonos horizontales se conservan las columnas laterales para los controles. La pausa mantiene su panel desplazable cuando sea necesario.

El cambio solo modifica la presentación de la partida individual. Conserva la simulación, las coordenadas internas, los escenarios, el input y los puntajes. La preparación y los resultados mantienen su distribución habitual.

## Comprobación integrada

Se inició una misión desde la interfaz real de Hosting, con un alias de prueba en el origen de vista previa. Se revisaron 1366×768, 1280×600, 1920×900, 320×568 y 844×390, incluidos controles táctiles normales y grandes. En cada medida, el documento coincide con el viewport, el canvas conserva 16:9 y su centro horizontal coincide con el de la ventana; vidas, puntaje, pausa y controles quedan dentro de sus límites. Se comprobó pausar, continuar, redimensionar la ventana y volver al menú: reaparecen la cabecera y el scroll normal de preparación.

Compilación aprobada y sin errores de consola durante la revisión. El registro de vista previa contiene las medidas de los elementos y los hashes de los recursos publicados. No se publicaron puntajes de prueba. Falta valoración en un teléfono físico.
