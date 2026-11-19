# Pausa activa 2.0 · Primera entrega jugable

18 de noviembre de 2026 · Etapa 1 del [roadmap](roadmap-videojuego.md).

## Qué incorpora

- TecnoIA, piloto gratuito de Operaciones y ST, con cabeza y dos manos flotantes. Sin cuerpo, brazos ni estrellas. El selector conserva los dos personajes de la edición anterior y sus desbloqueos locales.
- Siete estados del piloto: reposo, movimiento, disparo, esquiva, daño, victoria y derrota. Las piezas se animan con transformaciones independientes; no son siete secuencias de dibujos nuevas.
- Bosque nevado con luces navideñas, selector más breve y resultados con celebración o reacción al terminar.
- Simulación fija de 60 pasos por segundo, independiente de la frecuencia de dibujo. Diagonales normalizadas y límites de movimiento coherentes.
- Pausa visible y con Escape. Cambiar de ventana o esconder la pestaña limpia las entradas y pausa. Se continúa manualmente, sin recuperar el tiempo de la pausa.
- Un segundo y cuarto de protección tras recibir daño. La esquiva dura diez pasos y tiene una recarga de dos segundos y medio; protege durante el impulso. El jefe anuncia su siguiente disparo con una franja y un aviso antes de disparar.
- Disparo continuo con recarga compartida entre teclado, botón táctil y asistencia opcional. Los proyectiles solo consumen un objetivo; las eliminaciones se resuelven después de las colisiones.
- HUD con vidas, puntos, objetivo y duración de mejoras. Controles táctiles debajo del Canvas, con captura y cancelación del puntero, dos tamaños y disparo asistido configurable.
- Carga previa de imágenes, reintento y dibujo de respaldo para poder jugar si falla un recurso.
- Sonidos originales sintetizados, volumen y efectos reducidos. No requiere descargar audio ni autoriza voces o música externa.

## Controles

| Acción                               | Computadora          | Pantalla táctil      |
| ------------------------------------ | -------------------- | -------------------- |
| Mover                                | Flechas o WASD       | Joystick             |
| Disparar                             | Mantener Espacio     | Mantener Disparar    |
| Esquivar                             | Shift                | Esquiva              |
| Pausar / continuar                   | Escape               | Pausa / Continuar    |
| Ajustar sonido, asistencia y efectos | Menú inicial o pausa | Menú inicial o pausa |

Las preferencias, Data y desbloqueos siguen guardados en el dispositivo. El ranking sigue siendo **casual** y acepta el resultado del cliente. No es la futura clasificación competitiva verificada por servidor. Guardar el puntaje ya no reinicia automáticamente la partida.

## Estructura

`src/components/ActiveBreak.jsx` coordina las pantallas y el ciclo de vida. `src/game/` separa simulación, render, entradas, audio, recursos, preferencias, controles táctiles, vista previa y guardado. El código de simulación no depende de React, Canvas ni Firestore, y acepta un generador aleatorio para reproducir partidas en pruebas.

El arte del piloto y sus rectángulos de origen se documentan en la [ficha de TecnoIA](../design/characters/tecnoia/README.md). Los recursos históricos se mantienen; los fotogramas antiguos con chispas en forma de estrella no se usan para las reacciones del personaje.

## Validación y límites

La verificación local pasó 44 pruebas y la compilación de producción. Una partida completa reproducible alcanza y derrota al jefe sin alterar el estado desde la interfaz.

Las pruebas de `tests/arcade.test.js` comparan el estado completo de una partida idéntica a 30, 60 y 144 FPS; verifican pausa y límites de recuperación, diagonales, impactos simultáneos, consumo de proyectiles, asistencia, esquiva, aviso del jefe, finalización y reinicio. La revisión visual usa escritorio y tamaños de pantalla móvil en navegador. Una pantalla móvil simulada no sustituye una sesión en los teléfonos reales del equipo.

Antes de cerrar el criterio de salida de la etapa 1 queda el piloto con personas y dispositivos reales. La etapa 0 conserva pendiente el boceto/prototipo de arena y la decisión de cámara. La siguiente entrega de contenido es la primera misión del bosque y después la tanda de tres personajes. Las tres misiones, los otros once personajes nuevos y la arena multijugador todavía están pendientes.
