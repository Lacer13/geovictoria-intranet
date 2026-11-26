# CierreIA v2 · Verificación

26 de noviembre de 2026.

| Comprobación | Resultado |
| --- | --- |
| Fuente y transparencia | Tres expresiones, seis manos/accesorios, piezas completas. Fondo limpio y dos huecos revisados. RGB conservado durante la limpieza del alfa. |
| Recursos jugables | 233 fotogramas de 192 px, diez clips, dos páginas, fuente y miniatura. Todas las celdas tienen margen y contenido. |
| Disparo | Emisión inmediata por evento aceptado, retroceso normal y potente diferenciados. Dirección horizontal. |
| Anclajes | Orígenes normal y de Gran cierre conservados; prueba de nacimiento interpolado al moverse y esquivar. |
| Reglas del juego | Partida completa comparada con v1: mismo resultado, puntaje, pasos y vidas. Daño, colisiones, velocidad y recargas no cambian. |
| Carga y errores | Solo el guardián elegido. Recuperación con piezas v2, atlas o v1 ante fallos de páginas, fuente o metadatos. |
| Celebración | 72 fotogramas a 24 FPS, 3 segundos; final sostenido y movimiento reducido. |
| Navegador local | Selector, demostración de poder, misión, Gran cierre, disparo asistido, pausa y salida. Sin enviar puntajes. |
| Móvil emulado | 844×390 horizontal y 320×568 vertical con controles grandes. Ancho de página 320 y ancho desplazable 320; botones dentro de la vista. |
| Restauración del ensayo | Disparo asistido y controles grandes desactivados, movimiento reducido desactivado y viewport restablecido. |
| Teléfono real | Pendiente del usuario. No se midieron FPS ni memoria real. |

Capturas: [combate horizontal](../design/characters/cierreia/integracion-v2-horizontal.jpg), [320 px](../design/characters/cierreia/integracion-v2-320.jpg), [celebración](../design/characters/cierreia/revision-v2-celebracion.jpg).

La inspección de márgenes y el cálculo de memoria no sustituyen la evaluación en un dispositivo real. Fuentes, prompts y reproducción: [guía de CierreIA](../design/characters/cierreia/README-v2.md).

La versión conjunta con las mejoras sincronizadas pasó **140 pruebas generales y compilación**. Las reglas de Firestore coinciden con main, donde pasaron las 50 pruebas de permisos del PR #11.

Vista previa: [probar CierreIA](https://geovictoria-intranet-peru--cierreia-v2-h6hw6f5r.web.app/juego), disponible hasta el 3 de diciembre de 2026. Se verificaron por SHA-256 el HTML, los recursos iniciales y los cinco archivos del personaje contra la compilación local; todos respondieron 200 con sus tipos y encabezados esperados. [Registro del despliegue](releases/cierreia-v2-preview-2026-11-26.json).

En la vista previa se comprobó la selección de CierreIA, la demostración de poder, el inicio de misión, el botón Gran cierre, la pausa y la vuelta al selector. No se enviaron puntajes. El juego principal todavía conserva CierreIA v1.
