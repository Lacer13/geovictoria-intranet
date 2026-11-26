# CierreIA v2 · Disparo y acuerdo cerrado

26 de noviembre de 2026. **Publicado y comprobado en el [juego principal](https://geovictoria-intranet-peru.web.app/juego)**, con claridad de Gran cierre y controles aceptados por el usuario en su teléfono. Fuente creada con **ImageGen integrado**, con la identidad de CierreIA v1 como referencia. Alfa local según el procedimiento autorizado por el usuario.

## Actuación propia

- Disparo normal: 12 fotogramas a 60 FPS, emisión inmediata, retroceso y recuperación.
- Gran cierre: 18 fotogramas a 60 FPS, emisión dorada y retroceso mayor. Su anclaje conserva el origen físico existente del proyectil especial: 16 px a la derecha y 1 px arriba del centro del disparo básico a tamaño de 112 px.
- Poder: reacción del maletín y la cabeza que se combina con el disparo de la mano libre.
- Acuerdo cerrado: presenta el maletín, asiente, muestra el pulgar y vuelve al reposo. 72 fotogramas a 24 FPS, 3 s, una reproducción y pose final sostenida.

La fuente contiene **tres expresiones y seis manos/accesorios ilustrados**. Los **233 sprites** son composiciones de esas piezas mediante curvas y cambios de pose; no son 233 ilustraciones diferentes. Se conservan maletín, gorro, antenas, colores y emblema de tres barras.

## Recursos y revisión

- [Fuente opaca seleccionada](rig-v2-fuente-opaca.png), [alfa limpio](rig-v2-alpha-local.png), [rectángulos, semillas y SHA-256](rig-v2-parts.json), [prompts](prompt-secuencias-v2-01.md).
- [Ocho poses](poses-v2-contacto.webp), [celebración completa](celebracion-v2.gif), [72 fotogramas ordenados](celebracion-v2-contacto.webp).
- [Página de revisión local](revision-v2.html): reproducción, pausa, fotograma y movimiento reducido. Se abre con Vite en `/design/characters/cierreia/revision-v2.html`.
- [Partida horizontal](integracion-v2-horizontal.jpg), [320 px con controles grandes](integracion-v2-320.jpg), [gesto de acuerdo](revision-v2-celebracion.jpg).
- Recursos jugables: `public/characters/cierreia/sprites-v2.json`, dos páginas WebP de 192 px por fotograma, fuente limpia y miniatura.

El fondo medido es [202,218,228], con tolerancia 16. Solo se limpia el alfa del fondo conectado al perímetro y de dos huecos revisados: [275,586] en el asa del maletín y [289,941] entre los dedos. El RGB del búfer se conserva. Los rectángulos se ajustan a cada pieza completa: no se corta a ciegas una cuadrícula uniforme.

## Reproducción

```sh
npm run sprites:cierreia-game
node --test tests/cierreia-v2.test.js
npm test
npm run build
```

La exportación valida todas las celdas, márgenes y anclajes. El cargador solicita solo el guardián elegido y recupera piezas v2, atlas o v1 según el recurso que falle. Los otros guardianes mantienen su implementación.

## Verificación

Ocho pruebas específicas: piezas y alfa, 233 celdas, origen normal/especial, composición de acciones, celebración sin bucle, carga con fallos, partida completa equivalente a v1 y nacimiento de Gran cierre al moverse/esquivar. Se conservan cadencias, velocidad, daño, colisiones, recarga de diez segundos y puntaje; no cambia la simulación ni las reglas de Firestore.

Revisión local de selector, poder, combate, disparo asistido, pausa/reanudación y movimiento reducido a 844×390 y 320×568. A 320 px no hay desbordamiento horizontal y los controles grandes permanecen dentro del área visible. No se enviaron puntos al ranking; se restauraron los ajustes temporales y el tamaño del navegador. Sin errores ni advertencias en la página de revisión. El usuario aceptó claridad de Gran cierre y respuesta de los controles en teléfono real; dispositivo no informado, sin medición de FPS.

La integración sobre la plataforma sincronizada pasó **140 pruebas generales, 50 de permisos y build** en GitHub Actions. El [PR #12](https://github.com/Lacer13/geovictoria-intranet/pull/12) está integrado en main. Se promovió la vista previa validada por ID inmutable y se comprobaron 68 recursos y el recorrido de combate en producción. [Registro y restauración](../../../docs/releases/cierreia-v2-production-2026-11-26.json). CierreIA queda cerrado; sigue Prisma.
