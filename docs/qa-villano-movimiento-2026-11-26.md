# Villano · Movimiento visible en teléfono

26 de noviembre de 2026. El usuario informó que veía el diseño nuevo, pero parecía inmóvil.

Los archivos de El Desfase ya estaban publicados: la hoja de 168 fotogramas y sus metadatos coinciden por SHA-256 con GitHub. En el navegador se comprobó la carga del diseño nuevo con movimiento reducido desactivado. La flotación de la hoja desplaza solo 2,2 px: al reducir una celda de 192 px a un centinela de 80 px y luego a la pantalla del teléfono, el movimiento queda en una fracción de píxel.

La presentación ahora añade flotación e inclinación según el tamaño del rival, retroceso visible y reacción de impacto. La boquilla conserva su origen físico en el instante de disparar. Solo cambia el dibujo: no se modifican cuerpos de colisión, posiciones, salud, proyectiles, tiempos, puntos ni dificultad. Movimiento reducido conserva las poses quietas.

Dos pruebas de regresión comprueban el desplazamiento real de los píxeles de un centinela de 80 px, el reposo con movimiento reducido, el origen de emisión, la recuperación del retroceso y que la presentación no modifique la entidad. [Contacto de cuatro momentos](../design/enemies/desfase/flotacion-visible-contacto.webp).

La comparación inicial contra producción verificó:

| Recurso | SHA-256 |
| --- | --- |
| `/enemies/desfase/sprites-v1.webp` | `c7589190b45fb468ca90d5f8960648b53d29b8b933ab37210afe3b521576a201` |
| `/enemies/desfase/sprites-v1.json` | `64e9b777c0831b2fdfad3547731a2b7a62f238b6bd8591ebfc0cd4ac38f453ba` |

La fuente ilustrada y sus 168 fotogramas se conservan; esta corrección refuerza su presentación en el juego.

La revisión local del navegador comprobó avance a 80 px en dos momentos del ciclo, disparo y retroceso a 160 px con boquilla visible y movimiento reducido. No hubo errores ni advertencias en consola. La compilación y las 142 pruebas generales pasaron; siete pruebas específicas cubren el villano. No se enviaron puntos al ranking.

## Publicación

El [PR #13](https://github.com/Lacer13/geovictoria-intranet/pull/13) pasó 142 pruebas generales, 50 de permisos y compilación en [GitHub Actions](https://github.com/Lacer13/geovictoria-intranet/actions/runs/45885748666). Se fusionó en main como `a329a083ecd492612d41ef99a91e12327fb48622`.

Con la autorización explícita del usuario se promovió la versión inmutable `91dd01d6591f4ab5` al [juego principal](https://geovictoria-intranet-peru.web.app/juego). Se comprobaron 70 recursos por SHA-256, incluidos JS/CSS, el villano y CierreIA. En producción se revisaron recarga, inicio de misión, centinelas, disparo, pausa/reanudación y salida, sin errores ni advertencias de consola y sin enviar puntajes. No se modificaron ajustes. [Registro y restauración](releases/villano-movimiento-production-2026-11-26.json).

La corrección está publicada. Su aceptación posterior en un teléfono físico y una medición de FPS no forman parte de las comprobaciones realizadas.
