# TecnoIA v2 · Borrador de poses

19 de noviembre de 2026. Estado: segundo borrador visual y extracción automática verificada; pendiente de aprobación de arte e integración dentro del juego.

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

## Revisión y siguiente entrega

Se conserva la cabeza con gorro, dos manos flotantes, llave, paleta azul/dorada y emblema de engranaje. El proyector se coloca en la mano libre.

Antes de exportar sprites: comprobar dedos y continuidad de proporciones entre poses, suavizar el gesto de apuntado si resulta demasiado enfadado, limpiar los contornos y comprobar la legibilidad al tamaño real. La celda 07 es una pose de referencia; todavía falta la celebración completa de 48–72 fotogramas con entrada, gesto, saludo, remate y salida.

La cuadrícula 4×2 organiza ocho poses de revisión. No demuestra soporte de cuadrículas variables en el juego ni debe cargarse directamente como su hoja de animación. Sus dimensiones no se presuponen divisibles entre filas y columnas.

Después: corregir contornos y revisar las poses, separar fuentes de manos/rostro, producir las transiciones de disparo y celebración, definir metadatos y anclajes de boquilla, sincronizar eventos de simulación, sonido y render, y verificar las secuencias jugables. Mantener el trabajo en TecnoIA antes de pasar al siguiente guardián.

## Reproducir la separación automática

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

Los archivos de `revision-v2-borrador-02/` son resultados reproducibles de revisión. `poses.json` incluye la huella SHA-256 del PNG fuente y declara `kind: key-poses`, `productionReady: false`. No tiene clips jugables ni anclajes definitivos y no se carga en el catálogo. La lectura y el dibujo de hojas v2 dentro del juego siguen pendientes.

Comprobación realizada: 63 pruebas correctas (57 existentes y seis nuevas) y compilación de producción correcta, mediante los comandos de Node equivalentes a `npm test` y `npm run build`. Se inspeccionó la plancha de contacto; que un borde no esté cortado no demuestra que esté limpio.

## Preparación local

Se descargó el repositorio completo desde GitHub y se instalaron las dependencias de package-lock.json con npm ci --ignore-scripts. Las 57 pruebas de npm test y la compilación de producción con npm run build pasaron. Las pruebas de reglas requieren además el emulador de Firestore; no se ejecutaron localmente en esta preparación.

[Plan de animación y criterios de salida](../../../docs/roadmap-animacion-guardianes.md).
