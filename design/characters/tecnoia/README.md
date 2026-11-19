# TecnoIA · Operaciones y ST

![Concepto navideño de TecnoIA sin estrellas](concept-navidad-v1.png)

## Estado

Primer concepto visual del personaje piloto del elenco por categoría. El usuario indicó que le gustó el diseño y pidió retirar la estrella de la herramienta. La versión guardada incorpora esa corrección.

El concepto muestra cabeza y dos manos flotantes, sin torso ni brazos, casco azul y amarillo, emblema de engranaje, gorro navideño y llave de reparación convencional. Ningún personaje del elenco llevará estrellas en accesorios, emblemas, herramientas ni efectos propios.

## Recurso

- Archivo: `concept-navidad-v1.png`.
- PNG RGBA de 1254 × 1254 píxeles, con fondo transparente.
- Producido y editado con ImageGen integrado; no se utilizó la CLI ni una clave API.
- Referencias de familia visual: `public/victoria_st_spritesheet.png` y `public/victoria-navidad-pose-a.webp`.
- Verificación visual: cabeza, antenas, gorro, manos y herramienta completos dentro del encuadre; estrella retirada de la llave. Se comprobó el canal alfa y la transparencia en las cuatro esquinas.

## Piloto jugable · Pausa activa 2.0

La ampliación a doce guardianes incorpora ahora también [184 sprites de TecnoIA](../../../public/characters/tecnoia/sprites-v1.webp), con [metadatos](../../../public/characters/tecnoia/sprites-v1.json) y una celebración de 48 fotogramas. La [guía del elenco](../../../docs/guardianes-navidad.md) documenta la versión actual; el texto siguiente conserva el origen del piloto.

El [atlas transparente](../../../public/characters/tecnoia/rig-navidad-v1.png) contiene cabeza completa, mano con llave y mano abierta. Fue preparado con ImageGen integrado a partir del concepto aprobado, conservando el personaje sin cuerpo ni estrellas. Su prompt está en [prompt-rig-v1.md](prompt-rig-v1.md).

El Canvas combina las piezas con centros de giro y transformaciones independientes para siete estados: reposo, movimiento, disparo, esquiva, daño, victoria y derrota. Los rectángulos de origen, con margen y sin cortar antenas ni dedos, están en `src/game/characters.js`; las transformaciones están en `rigPose` y `src/game/render.js`. El atlas se usa sin alterar su alfa y sin generar manualmente cada fotograma. La animación de habilidad propia queda pendiente de implementar esa mecánica.

El concepto original se conserva como referencia. TecnoIA y los otros once guardianes son seleccionables sin coste; el [catálogo por área](../../../docs/personajes-por-area.md) y el [roadmap](../../../docs/roadmap-videojuego.md) reflejan la ampliación completa del arcade.

El prompt final de edición está en [prompt-final.md](prompt-final.md).
