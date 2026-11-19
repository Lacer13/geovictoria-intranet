# ConectIA v2 · Estudio de actuación

19 de noviembre de 2026. Primer hito de ConectIA después de cerrar y publicar el piloto TecnoIA. **Fuente y tres secuencias de estudio producidas; integración jugable pendiente.** El arcade conserva ConectIA v1.

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

Los metadatos declaran `kind: animation-study` y `productionReady: false`. Pendientes: estados de movimiento, impacto, poder y descanso jugables; carga por personaje y respaldo; eventos de emisión, interpolación, sonido; partida y resultados; validación móvil y publicación individual. Se reutilizará la infraestructura del piloto conservando la actuación propia de ConectIA. No se inicia CierreIA hasta cerrar esos criterios.

[Roadmap de animación](../../../docs/roadmap-animacion-guardianes.md).
