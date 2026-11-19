# TecnoIA v2 · Piloto jugable

19 de noviembre de 2026. Estado: piloto integrado al selector, la partida y los resultados en esta rama; pendiente de validación en dispositivos reales y publicación en Firebase.

## Entrega actual · Integración jugable

TecnoIA usa **203 fotogramas jugables**, con reposo, movimiento, disparo, apuntado sostenido, esquiva, impacto, poder, descanso y celebración. Se conecta a la misma simulación de 60 pasos/s: cada descarga aceptada produce un evento con identificador, paso, origen y proyectiles. El consumidor reproduce el sonido una sola vez. El disparo doble y el abanico comparten una reacción por descarga; Gran cierre y Reflejo también registran sus emisiones sin cambiar sus poderes.

El pivote del dibujo alinea la boquilla con el centro original del proyectil de 24×6: `p.x + p.width - 4`, `p.y + 63`. **Se ajusta el arte, no las posiciones físicas, el daño, las recargas o la colisión.** Los proyectiles recién nacidos se interpolan desde esa boquilla junto al movimiento del actor, incluidas las dos ramas de disparo doble. Movimiento, daño y esquiva pueden actuar sobre cabeza/llave mientras la mano libre dispara hacia la derecha. La fase de emisión depende del paso de simulación, no de un bucle del reloj de dibujo.

Recursos del piloto:

- [Metadatos de los 203 sprites](../../../public/characters/tecnoia/sprites-v2.json).
- [Página 1: 2304×3072](../../../public/characters/tecnoia/sprites-v2-1.webp) y [página 2: 2304×192](../../../public/characters/tecnoia/sprites-v2-2.webp), celdas de 192×192.
- [Fuente limpia de recuperación](../../../public/characters/tecnoia/rig-navidad-v2.png) y [miniatura](../../../public/characters/tecnoia/portrait-v2.webp).
- [Captura de combate en Chrome](integracion-v2-combate.jpg) y [resultados de una partida local](integracion-v2-juego.jpg).

La carga solicita únicamente el guardián elegido. Si falla una página o sus metadatos, dibuja las piezas v2 con los mismos anclajes; si falla la fuente y las hojas están completas, usa los sprites, priorizando la emisión sobre la reacción de cabeza. Si no queda ninguna representación v2 completa, recupera v1 y ofrece reintentar. Incluso si fallan todos los bitmaps, conserva cabeza y dos manos completas con un proyector de recuperación visible en el origen físico. Un recurso ausente o de dimensiones incorrectas no bloquea el inicio. Los once guardianes restantes mantienen sus recursos v1.

La celebración de resultados dura 2,5 s y mantiene el reposo final; los botones continúan disponibles. La vista previa «Disparando» incluye la salida visible de un proyectil de demostración, sin guardar puntos. Movimiento reducido conserva apuntado y victoria reconocibles. Se verificaron en Chrome carga, disparo asistido/manual, movimiento, esquiva, pausa/reanudación, ajustes reducidos, derrota, reinicio y celebración desde el selector. Las capturas pertenecen a localhost; no se envió un resultado al ranking.

Reproducir recursos y abrir el piloto:

```sh
npm run sprites:tecnoia-game
npm run dev
# Abrir /juego en el servidor local.
```

El conjunto v2 suma aproximadamente **3,26 MB** con fuente, dos hojas, miniatura y metadatos; las hojas contienen 7.520.256 píxeles (unos 30,1 MB RGBA antes de copias/GPU). Se mantienen el límite de caché y la carga por personaje. El rendimiento real en teléfonos debe medirse en el piloto del equipo.

Validación: **77 pruebas correctas** y compilación de producción. Ocho nuevas pruebas de integración cubren cadencias, eventos, poderes, interpolación, pausa/FPS, movimiento/daño/esquiva, las 203 celdas, recuperación ante fallos y una partida completa hasta victoria con animación final que no modifica las reglas. Pendiente: prueba en dispositivos reales, observaciones de actuación y publicación en Firebase antes de cerrar TecnoIA y pasar a ConectIA.

## Segundo hito conservado · Secuencias de estudio

- [Fuente opaca conservada](rig-v2-fuente-opaca.png), [atlas con alfa local limpio](rig-v2-alpha-local.png) y [rectángulos/procedencia](rig-v2-parts.json).
- [Celebración animada](revision-v2-secuencias-01/victory.gif) y [sus 60 fotogramas ordenados](revision-v2-secuencias-01/victory-contacto.webp).
- [Demostración de disparo y salida del proyectil](revision-v2-secuencias-01/disparo-demostracion.gif) y [12 fotogramas de disparo](revision-v2-secuencias-01/shooting-contacto.webp).
- [Hojas, tiempos y anclajes](revision-v2-secuencias-01/secuencias.json).
- [Página de revisión interactiva](revision-v2.html) y [prompts completos del proceso](prompt-secuencias-v2-01.md).

La celebración tiene **60 fotogramas a 24 FPS (2,5 s)**: pasa de combate a una expresión alegre, eleva la llave, saluda cambiando la articulación de los dedos, mantiene un remate y vuelve al reposo. El disparo tiene **12 fotogramas a 60 FPS (0,2 s)**, comienza en emisión y recupera el apuntado tras el retroceso. Las formas de la mano y las expresiones vienen de dibujos diferentes; las posiciones se unen mediante curvas. La dirección de la boquilla se mantiene horizontal hacia la derecha.

Los intentos de transparencia de ImageGen seguían dejando residuos. El usuario eligió explícitamente **«Limpiar el alfa con un proceso local»**. Se conservó un render opaco limpio sobre gris y se eliminó únicamente el fondo de color próximo a `[212,223,231]` conectado al borde, con tolerancia 14. El proceso preserva RGB y no borra los blancos del rostro o los dedos. Se revisaron los contornos sobre fondos claro y oscuro, así como los rectángulos completos de cada pieza.

Reproducir fuentes y secuencias:

```sh
npm run sprites:tecnoia-v2
# Equivalente:
node scripts/build-tecnoia-v2.mjs
```

Para revisar en movimiento: iniciar Vite (`npm run dev`) y abrir `/design/characters/tecnoia/revision-v2.html`. La página permite cambiar clip, reproducir/pausar/reiniciar, avanzar por fotograma, cámara lenta de ¼, tamaños 112/160/320, fondo claro/oscuro e indicador de boquilla. En movimiento reducido se muestra una pose de victoria legible. Se comprobó en Chrome la carga de las páginas, el final en reposo, el final en apuntado, las opciones de tamaño, cámara lenta y movimiento reducido.

Se exportan una hoja de disparo de **1280×960** y otra de celebración de **2560×2560**; solo se registran sus 12 y 60 celdas utilizadas. Cada fotograma tiene anclajes locales de mano/boquilla y pivote; al guardar el proyector, la boquilla pasa a `null`. El lector utiliza los nombres ordenados de cada clip y las páginas de sus metadatos, sin constantes de v1. Los GIF sirven para revisión sin audio: su precisión de centésimas se compensa para conservar 0,2 y 2,5 segundos totales.

**Estado histórico de este estudio:** sus archivos declaran `productionReady: false` y conservan las 72 poses secuenciales originales. La integración posterior está en los recursos públicos descritos arriba; no se reinterpretan estas hojas fuente como el paquete jugable completo.

Validación del segundo hito: **69 pruebas correctas** y compilación de producción correcta. Las seis nuevas comprobaciones cubren limpieza de alfa y conservación de colores interiores, procedencia, márgenes de las piezas, fases y final de los clips, boquilla en los píxeles cian exportados y duración/cantidad de fotogramas de los GIF. La anatomía y el gesto requieren además la revisión visual realizada.

## Primer hito conservado · Borradores de ocho poses

## Recursos

- [Segundo borrador con gesto de combate suavizado](poses-v2-borrador-02.png).
- [Revisión sobre fondos oscuro y claro, a 160 y 320 px](revision-v2-borrador-02/contacto.webp).
- [Página de poses transparentes a 320×320](revision-v2-borrador-02/poses-page-1.png).
- [Metadatos y comprobaciones de cada pose](revision-v2-borrador-02/poses.json).
- [Manifiesto de extracción con rectángulos explícitos](poses-v2-borrador-02.manifest.json).
- [Prompt completo del segundo borrador e intento de limpieza](prompt-poses-v2-borrador-02.md).
- [Lámina para revisión sobre fondo claro](poses-v2-borrador-01.png).
- [Variante con extracción de fondo](poses-v2-borrador-01-alpha.png).
- [Prompts completos y método](prompt-poses-v2-borrador-01.md).

Las imágenes son propuestas de poses clave, no secuencias de animación terminadas. La variante de fondo extraído necesita revisión de bordes y halos antes de utilizarse como arte de producción. El juego sigue usando los recursos v1.

El segundo borrador conserva la sonrisa durante el combate y elimina la numeración del arte fuente. **No está aprobado para producción:** persisten halos de color y píxeles sueltos; se deben revisar también dedos, retroceso y orientación horizontal de la boquilla. Un segundo intento de limpieza con ImageGen no resolvió los contornos y se descartó. La extracción no altera ni intenta limpiar esos píxeles.

## Lectura de la lámina

| Pose | Acción |
| --- | --- |
| 01 | Reposo |
| 02 | Apuntado con proyector en la mano libre |
| 03 | Emisión hacia la derecha |
| 04 | Retroceso |
| 05 | Recuperación |
| 06 | Esquiva |
| 07 | Pose clave de celebración con llave elevada y saludo |
| 08 | Descanso |

## Revisión del primer hito (histórico)

Se conserva la cabeza con gorro, dos manos flotantes, llave, paleta azul/dorada y emblema de engranaje. El proyector se coloca en la mano libre.

Antes de exportar sprites: comprobar dedos y continuidad de proporciones entre poses, suavizar el gesto de apuntado si resulta demasiado enfadado, limpiar los contornos y comprobar la legibilidad al tamaño real. La celda 07 es una pose de referencia; todavía falta la celebración completa de 48–72 fotogramas con entrada, gesto, saludo, remate y salida.

La cuadrícula 4×2 organiza ocho poses de revisión. No demuestra soporte de cuadrículas variables en el juego ni debe cargarse directamente como su hoja de animación. Sus dimensiones no se presuponen divisibles entre filas y columnas.

Después: corregir contornos y revisar las poses, separar fuentes de manos/rostro, producir las transiciones de disparo y celebración, definir metadatos y anclajes de boquilla, sincronizar eventos de simulación, sonido y render, y verificar las secuencias jugables. Mantener el trabajo en TecnoIA antes de pasar al siguiente guardián.

## Reproducir la separación del primer hito

Desde la raíz del repositorio:

```sh
npm run poses:tecnoia
```

Equivalente sin el comando npm en PATH:

```sh
node scripts/build-pose-sheet.mjs design/characters/tecnoia/poses-v2-borrador-02.manifest.json
```

La imagen fuente mide **1774×887**: no se divide exactamente en cuatro columnas y dos filas de píxeles enteros. El manifiesto registra los rectángulos inspeccionados de 443/444 px. El script verifica las dimensiones antes de cortar, rechaza solapamientos, celdas sin contenido y siluetas que tocan el borde, y exporta ocho PNG de 320×320 con alfa, una página de 1280×640 y la plancha comparativa. No recorta cada silueta por separado ni cambia su encuadre para aparentar más movimiento.

El empaquetador admite celdas rectangulares, filas/columnas variables, márgenes, separación y varias páginas. Las celdas sobrantes no se registran como fotogramas. Las comprobaciones geométricas 7×7 y 8×9 usan datos de prueba; no generan nuevas poses del personaje.

Los archivos de `revision-v2-borrador-02/` son resultados reproducibles de revisión. `poses.json` incluye la huella SHA-256 del PNG fuente y declara `kind: key-poses`, `productionReady: false`. No tiene clips jugables ni anclajes definitivos y no se carga en el catálogo. El lector y el dibujo actuales utilizan el paquete jugable posterior descrito al inicio de esta guía.

Comprobación realizada: 63 pruebas correctas (57 existentes y seis nuevas) y compilación de producción correcta, mediante los comandos de Node equivalentes a `npm test` y `npm run build`. Se inspeccionó la plancha de contacto; que un borde no esté cortado no demuestra que esté limpio.

## Preparación local

Se descargó el repositorio completo desde GitHub y se instalaron las dependencias de package-lock.json con npm ci --ignore-scripts. Las 57 pruebas de npm test y la compilación de producción con npm run build pasaron. Las pruebas de reglas requieren además el emulador de Firestore; no se ejecutaron localmente en esta preparación.

[Plan de animación y criterios de salida](../../../docs/roadmap-animacion-guardianes.md).
