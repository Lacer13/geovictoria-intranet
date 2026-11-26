# El Desfase · Rival animado

24 de noviembre de 2026. El jefe y los centinelas de Aventura y Clásico comparten una fuente nueva con ocho poses completas, mirando a la izquierda y con un cañón visible. Se conservan la armadura blanca, juntas oscuras, detalles turquesa y núcleo rojo del jefe anterior; sin estrellas, rayos ni letras.

## Recursos y reproducción

- `poses-v1.png`: fuente transparente producida con la herramienta integrada ImageGen, usando `public/Boss.png` como referencia de identidad. No se retocó el alfa.
- `contacto-v1.webp`: revisión de las ocho poses a 160 y 80 px.
- `public/enemies/desfase/sprites-v1.webp`: 168 celdas de 192×192, hoja de 2304×2688; aproximadamente 1,69 MB.
- `public/enemies/desfase/sprites-v1.json`: rectángulos explícitos, clips, pivote, boquilla y huella SHA-256 de la fuente.
- `revision-v1.html`: revisión local con combate simulado, cámara lenta, fotograma manual, tamaños 80/160/320, movimiento reducido y fallo de imágenes. No accede al backend ni guarda puntos.

Reproducir con `npm run sprites:enemies`. Abrir `/design/enemies/desfase/revision-v1.html` con Vite. La fuente mide 1774×887: el exportador utiliza límites enteros explícitos para evitar recortes por una división fraccionaria de la cuadrícula 4×2.

| Secuencia | Fotogramas | Duración |
| --- | ---: | ---: |
| Entrada | 24 | 0,6 s |
| Flotación | 24 | 1 s |
| Avance | 24 | 0,8 s |
| Preparación y carga | 30 | 0,5 s |
| Emisión, retroceso y recuperación | 18 | 0,3 s |
| Impacto | 18 | 0,3 s |
| Desactivación | 30 | 0,75 s |

Son ocho poses dibujadas y secuencias intermedias obtenidas con desplazamientos, inclinación, iluminación y transparencia. No son 168 dibujos independientes. El cañón se carga, dispara, retrocede y recupera su postura; el origen visible coincide con el borde posterior del proyectil en el instante de emisión. Se conservan posiciones físicas, velocidades, daño, aviso de 30 pasos y recargas de 100/80 pasos del jefe y 150 del centinela.

La animación depende de eventos de la simulación, no de cada repintado. Se interpola también el nacimiento del proyectil cuando el enemigo se mueve. Los enemigos derrotados pasan a una lista puramente visual y dejan de colisionar inmediatamente. La victoria muestra la desactivación durante 0,75 s con la simulación ya terminada; movimiento reducido pasa directamente a resultados. El atlas ausente o inválido recupera el arte anterior o un robot completo con emisor visible.

El prompt y la referencia se registran en [prompt-v1.txt](prompt-v1.txt). Las pruebas comprueban las 168 celdas, transparencia en márgenes, boquilla con píxeles visibles, aviso/disparo/recarga, interpolación, retirada de colisiones y respaldo sin imágenes. La revisión visual local se registra junto a este documento.

## Verificación local

116 pruebas aprobadas y compilación correcta. En navegador se comprobaron combate simulado con jefe y centinela tirador, emisión y retroceso en fotogramas separados, movimiento reducido y respaldo sin imágenes. En `/juego` se inició Arcade con VictorIA Clásica, se disparó contra centinelas, se pausó y se salió sin guardar resultados ni sumar Data. Se restauraron CierreIA y Aventura, que estaban seleccionados antes de la prueba. No hubo errores ni advertencias en las consolas de ambas páginas.

Capturas: [emisión](revision-disparo.jpg), [retroceso](revision-retroceso.jpg) y [partida integrada en pausa](integracion-v1-partida.jpg). No se ha realizado una medición de FPS en un teléfono físico.

## Legibilidad en teléfono · 26 de noviembre

El usuario veía el diseño nuevo, pero lo percibía inmóvil. Los recursos estaban publicados y coincidían con GitHub; la oscilación original de 2,2 px quedaba en una fracción de píxel al reducirse a un centinela en teléfono. La presentación añade flotación e inclinación según el tamaño, retroceso y reacción de impacto, manteniendo la boquilla en el origen físico al disparar y las poses quietas al reducir movimiento. [Comprobaciones y contacto](../../../docs/qa-villano-movimiento-2026-11-26.md). La simulación y la fuente ilustrada se conservan.

El [PR #13](https://github.com/Lacer13/geovictoria-intranet/pull/13) está fusionado en main y publicado con autorización del usuario. Pasaron 142 pruebas generales, 50 de permisos y compilación. Se comprobaron 70 recursos y el combate en producción, sin errores de consola ni envío de puntajes. [Publicación y restauración](../../../docs/releases/villano-movimiento-production-2026-11-26.json).
