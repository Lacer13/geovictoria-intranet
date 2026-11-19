# ConectIA v2 · Piloto jugable

19 de noviembre de 2026. **ConectIA v2 integrado al selector, partida y resultados en esta rama, con Ráfaga y controles aceptados por el usuario en su teléfono.** [Vista previa jugable](https://geovictoria-intranet-peru--conectia-v2-97yuioz1.web.app/juego), disponible hasta el 26 de noviembre a las 17:20 (Lima). Publicación de producción pendiente.

## Integración jugable actual

El paquete público contiene **221 sprites de 192×192 en dos páginas WebP**, diez clips, miniatura, fuente limpia y metadatos de pivote/boquilla. Incluye reposo, movimiento, disparo normal, Ráfaga, apuntado sostenido, esquiva de presentación, daño, activación de poder, descanso/derrota y la celebración completa de 72 fotogramas. No se concede a ConectIA el poder de esquiva de TecnoIA: conserva Ráfaga.

Cada emisión aceptada conserva su intervalo de 12 o 6 pasos. Cambiar el poder durante una reacción no reinicia ni estira el disparo anterior. La cabeza y la baliza pueden reaccionar al moverse, recibir daño o activar el poder mientras la mano libre dispara horizontalmente. Se alinea el arte con el origen físico anterior y se reutilizan los eventos, sonido deduplicado e interpolación de proyectiles del piloto. Mecánicas, daño, recargas y colisiones se conservan.

El selector demuestra el disparo y la Ráfaga; resultados reproduce «Conexión lograda» una vez durante 3 segundos y sostiene el reposo final. La carga solicita únicamente el personaje elegido. Si falla una hoja, utiliza piezas v2; si falla la fuente y quedan las hojas completas, utiliza atlas, priorizando la emisión; si no queda v2 completo, recupera v1 con proyector de respaldo y reintento. TecnoIA conserva su implementación y los otros diez guardianes siguen en v1.

```sh
npm run sprites:conectia-game
npm run dev
# Abrir /juego, elegir ConectIA.
```

Recursos: [metadatos](../../../public/characters/conectia/sprites-v2.json), [página 1](../../../public/characters/conectia/sprites-v2-1.webp), [página 2](../../../public/characters/conectia/sprites-v2-2.webp), [fuente](../../../public/characters/conectia/rig-navidad-v2.png) y [registro de vista previa](../../../docs/releases/conectia-v2-preview-2026-11-19.json). El paquete suma aproximadamente 3,44 MB. Las hojas de 2304×3072 y 2304×576 contienen unos 33,6 MB RGBA antes de copias/GPU.

**91 pruebas y build correctos.** Las nueve pruebas de integración cubren cadencias, cambio de poder, 30/60/144 FPS, pausa, movimiento/daño/disparo, boquilla, las 221 celdas y fallos de carga. Una partida completa con Ráfaga llega a victoria y coincide con la simulación v1 en resultado, puntaje, pasos y vidas. Los recursos publicados coinciden por SHA-256 con el build.

El usuario confirmó «Sí, se ve y responde bien» al consultar claridad del disparo al activar Ráfaga y respuesta de controles en su teléfono. Modelo y navegador no informados; no se midieron FPS. La revisión del navegador comprobó selector/poder, partida, Ráfaga, pausa/reanudación y efectos reducidos a 844×390 y 320×568 con controles grandes. A 320 px no hay desbordamiento y los tres controles quedan dentro de la pantalla. [Partida](integracion-v2-rafaga.jpg) y [320 px](integracion-v2-320.jpg). No se envió puntaje al ranking.

## Estudio original conservado

## Resultado

Se conserva la identidad coral, blanca y dorada de Comercial: cabeza completa, antenas, gorro, ojos cian y emblema de eslabones. Una mano mantiene la baliza de comunicación con aro; la mano libre utiliza un proyector coral/dorado dirigido a la derecha. El accesorio de presentación sigue siendo una baliza.

| Secuencia | Fotogramas / duración | Actuación |
| --- | --- | --- |
| Disparo normal | 12 a 60 FPS · 0,2 s | Emisión, retroceso, recuperación y apuntado. |
| Ráfaga | 6 a 60 FPS · 0,1 s | Retroceso corto y recuperación antes de la siguiente descarga; conserva la boquilla horizontal. |
| Conexión lograda | 72 a 24 FPS · 3 s | Guarda el proyector, eleva la baliza con dos impulsos de vitoreo, abre la mano, muestra pulgar arriba y vuelve al reposo. Una reproducción; mantiene el final. |

Son **90 fotogramas de estudio en tres páginas WebP**, con celdas de 320×320 y metadatos de orden, FPS, pivote y boquilla. No equivalen a 90 dibujos independientes: tres expresiones y seis variantes de manos/accesorios ilustradas se componen mediante curvas y cambios de pose. No se reutiliza el saludo de TecnoIA para la celebración.

La Ráfaga existente dura 3 segundos, duplica la cadencia y recarga en 10 segundos. Este estudio utiliza los intervalos actuales de la simulación: 12 pasos entre emisiones normales y 6 durante Ráfaga, a 60 pasos/s. No altera recargas, daño, hitbox, puntuación o velocidad. La comparación muestra seis emisiones normales frente a doce de Ráfaga en 1,2 segundos; no crea partidas ni guarda puntos.

## Revisar y reproducir

```sh
npm run sprites:conectia-v2
npm run dev
# Abrir /design/characters/conectia/revision-v2.html
```

La [página de revisión](revision-v2.html) permite reproducir, pausar, mover el fotograma, comparar cadencias, cámara lenta a ¼, tamaños 112/160/320 px, fondo claro/oscuro, boquilla y movimiento reducido. Respeta la preferencia de movimiento reducido y no reproduce automáticamente. Al ocultar la página pausa la animación.

- [Plancha de ocho poses a 160/320 px](revision-v2-secuencias-01/poses-contacto.webp).
- [Comparación animada de cadencias](revision-v2-secuencias-01/normal-vs-rafaga.gif).
- [Disparo](revision-v2-secuencias-01/shooting.gif), [Ráfaga](revision-v2-secuencias-01/burst.gif) y [celebración completa](revision-v2-secuencias-01/victory.gif).
- [Plancha de los 72 fotogramas de celebración](revision-v2-secuencias-01/victory-contacto.webp).
- [Metadatos de las secuencias](revision-v2-secuencias-01/secuencias.json).
- Capturas del navegador: [celebración](revision-v2-celebracion.jpg) y [seis frente a doce emisiones](revision-v2-cadencias.jpg).

## Fuente y alfa

[Fuente opaca original](rig-v2-fuente-opaca.png), [atlas con alfa local](rig-v2-alpha-local.png), [parámetros y SHA-256](rig-v2-parts.json) y [prompts completos](prompt-secuencias-v2-01.md). Generados con **ImageGen integrado** usando el atlas v1 de ConectIA como referencia de identidad; no se utilizó la API ni una clave externa.

La petición transparente dejó residuos, por lo que se produjo una fuente opaca con el mismo contenido, conservada sin modificaciones. Se aplicó el proceso local de alfa autorizado por el usuario: fondo medido `[203,219,230]`, tolerancia 16, relleno desde bordes. El hueco cerrado de la baliza se limpia únicamente desde la semilla comprobada `[204,470]`. La operación conserva RGB y no borra globalmente colores blancos del rostro o dedos. Si la fuente cambia, las dimensiones, la semilla y su checksum permiten detectar que debe revisarse de nuevo.

## Verificación y pendiente

**82 pruebas y compilación correctas; lint de los archivos nuevos sin avisos.** Las cinco pruebas nuevas comprueban limpieza del aro sin borrar blancos/juntas/colores interiores, procedencia y márgenes de nueve piezas, cadencias contra eventos reales de la simulación y regreso a normal al acabar el poder, final de celebración/movimiento reducido y lectura de las 90 celdas con boquilla sobre píxeles cian.

Revisión en navegador local: celebración completa hasta `72/72 · reposo`; disparo normal hasta `12/12 · apuntado`; Ráfaga hasta `6/6 · apuntado`; comparación de seis/doce emisiones, cámara lenta, fondos claro y oscuro, tamaños 112/160/320 y pose reducida. Sin errores ni advertencias de consola. No se probó todavía esta versión en teléfonos reales.

Los metadatos de estas hojas fuente conservan `kind: animation-study` y `productionReady: false`. Los recursos públicos posteriores declaran `kind: playable-pilot` y `productionReady: true`, indicando estructura jugable completa. La integración descrita arriba reutiliza la infraestructura de TecnoIA y conserva la actuación propia de ConectIA. Pendiente de cierre: publicación individual; CierreIA espera.

[Roadmap de animación](../../../docs/roadmap-animacion-guardianes.md).
