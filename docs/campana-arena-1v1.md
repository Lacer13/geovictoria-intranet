# Campaña y arena 1 contra 1

20 de noviembre de 2026. Por pedido del usuario, niveles y multijugador pasan delante de las nuevas animaciones. TecnoIA y ConectIA conservan v2; CierreIA espera.

[Vista previa de la campaña](https://geovictoria-intranet-peru--aventura-arena-jzta4odk.web.app/juego), hasta el 27 de noviembre de 2026 a las 09:35 (Lima). La arena pública aún no está configurada en ese build: su prueba de dos clientes utiliza el servidor local. [Registro y huellas](releases/aventura-arena-preview-2026-11-20.json).

## Campaña implementada

El menú permite elegir **Aventura · 3 niveles** o conservar **Arcade rápido**. Cada misión desbloquea la siguiente y guarda el avance y el mejor puntaje en este dispositivo (`geo_campaign_v1`). Al perder se puede repetir; cada misión empieza con tres vidas. El avance se conserva al cambiar de guardián. El puntaje de campaña no se envía a la clasificación del arcade.

| Nivel | Objetivo previo al jefe | Variedad |
| --- | --- | --- |
| Las luces del bosque | 90 segundos de ruta y al menos 18 robots | Patrullas rectas y en zigzag; centinela de 24 de energía. |
| El taller congelado | 105 segundos y tres núcleos de reparación recogidos | Tiradores y zigzag; los núcleos perdidos vuelven a aparecer; jefe de 32. |
| El último encendido | 120 segundos y al menos 28 robots | Más tiradores; guardián de 44 y abanico de disparos al bajar de media energía. |

Los tiempos son mínimos antes del jefe, no una garantía de duración. La prueba automatizada completa los tres niveles en unos 5,5 minutos de simulación; una partida humana puede durar más o requerir reintentos. Se reutilizan guardianes, poderes, controles, pausa y efectos reducidos. Los tiradores avisan con un aro antes de disparar.

## Arena implementada

**Carga el faro** conecta dos clientes por WebSocket a un servidor Node. Cada persona usa su dispositivo y entra con un código de ocho caracteres o una invitación. Alias, guardián, confirmación de ambos, cuenta atrás de tres segundos, resultado y revancha están implementados.

Ambos tienen el mismo kit: movimiento, disparo y esquiva de 2,5 s de recarga, tres puntos de energía, reaparición tras dos segundos y protección temporal. La baliza del centro se entrega en la base propia. Gana quien complete cinco entregas o tenga más al terminar tres minutos; hay una sola prórroga de 30 segundos si empatan. Un impacto hace caer la luz. Los marcadores se distinguen por color, nombre y rótulo de base.

El servidor calcula movimiento permitido, colisiones, impactos, recargas, entregas y ganador. El cliente manda intenciones, no posiciones ni puntajes. Hay límite de mensajes, tamaño de paquete, secuencia por ronda, salas de dos jugadores y un máximo inicial de 32 salas por proceso. La invitación contiene solo el código; la credencial de reconexión queda en la pestaña del participante y no se publica en la lista de jugadores.

La partida no pausa al perder el foco. Se limpian teclas y el servidor neutraliza entradas antiguas. Una conexión puede recuperarse durante 15 segundos; después se resuelve el abandono. Las salas son temporales y viven en memoria de una sola instancia. Un reinicio del servidor pierde esas salas: persistencia y despliegue con varias instancias quedan fuera de este piloto. La arena no concede Data ni escribe en el ranking casual.

## Ejecución y publicación

```sh
npm ci --ignore-scripts
npm run arena:server
# En otra terminal:
npm run dev
```

Abrir `/juego`, seleccionar **Arena en línea · 1 vs 1**, crear sala y abrir su invitación en otro cliente. En desarrollo se utiliza `ws://127.0.0.1:8787/arena`. Para una prueba LAN, configurar `VITE_ARENA_URL` con la dirección accesible del servidor antes de iniciar Vite y añadir el origen de Vite a `ARENA_ALLOWED_ORIGINS` del servidor.

En Hosting HTTPS, el cliente requiere `VITE_ARENA_URL=wss://DOMINIO_DEL_SERVIDOR` en el build. No contiene una clave secreta. Sin esa configuración la aventura funciona y la arena informa que está en preparación, sin simular un rival en línea. Nunca colocar tokens de reconexión en variables de build o enlaces.

Se incluyen:

- `server/Dockerfile` y lockfile mínimo de servidor: Node 22, usuario sin privilegios, solo `ws` y reglas de arena.
- `render.yaml`: servicio Free, comprobación `/health` y despliegues automáticos desactivados. Render documenta la suspensión por inactividad y el arranque de aproximadamente un minuto: adecuado para un piloto, no una garantía de disponibilidad. [Plan gratuito](https://render.com/docs/free), [WebSockets](https://render.com/docs/websocket).
- `server/cloudrun.yaml`: una instancia como máximo, mínimo cero, 256 MiB, un CPU y timeout de una hora. Reemplazar imagen y cuenta de servicio por valores reales; la cuenta de arena no necesita roles de Firestore ni de administración del proyecto. Requiere facturación habilitada y acceso público al servicio. Las conexiones WebSocket abiertas consumen recursos facturables; las cuotas gratuitas no son un límite de gasto. [WebSockets en Cloud Run](https://docs.cloud.google.com/run/docs/triggering/websockets), [precios](https://cloud.google.com/run/pricing).

La consulta de solo lectura al proyecto actual devolvió `billingEnabled: false`. No se habilitó facturación, no se creó un servicio externo y no se cambió Firestore. La publicación del servidor de arena depende de elegir el alojamiento y conectar la cuenta correspondiente.

## Comprobaciones

**101 pruebas y compilación correctos; lint de los archivos modificados sin avisos.** Pruebas de simulación: objetivos y tiempos de los tres niveles, reparación y reaparición de núcleos, segunda fase del jefe, avance secuencial y una campaña completa con vidas normales. Arena: movimiento simétrico, diagonales, obstáculos, esquiva, impactos, caída de luz, reaparición, cinco entregas, prórroga y resultado inmutable.

Prueba de red con dos conexiones WebSocket: crear/unir, listos, misma ronda, rechazo de posición/puntaje inventados y mensajes antiguos, recuperación de credencial, mismo ganador y revancha. Revisión en dos pestañas independientes: invitación, recogida y entrega mediante teclado, marcador idéntico, recuperación tras recarga, resultado compartido y revancha. A 844×390 la arena y controles caben sin desplazamiento.

Evidencia: [misiones](../design/gameplay/2026-11-20/campana-misiones.jpg), [campaña a 320 px](../design/gameplay/2026-11-20/campana-320.jpg), [arena con dos clientes](../design/gameplay/2026-11-20/arena-dos-clientes.jpg), [arena horizontal](../design/gameplay/2026-11-20/arena-horizontal.jpg). Campaña a 320×568 con controles grandes y arena a 844×390, sin desbordamiento. La prueba entre dos dispositivos por Internet queda pendiente de publicar el servidor.
