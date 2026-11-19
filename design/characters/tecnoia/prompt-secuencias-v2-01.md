# TecnoIA v2 · Fuente y secuencias de estudio 01

19 de noviembre de 2026. ImageGen integrado; sin API ni CLI de generación. Los intentos transparentes se descartaron por residuos; se conserva el render opaco limpio como `rig-v2-fuente-opaca.png`.

## 1. Fuente nueva de nueve piezas

Referencia de identidad: `public/characters/tecnoia/rig-navidad-v1.png`.

```text
Use case: identity-preserve.
Asset type: production-source PARTS ATLAS for a 2D Christmas arcade character named TecnoIA. The reference is approved identity/material only. Produce a NEW clean render of the same character with new facial and hand drawings, not a pixel-preserving edit of the reference's dirty edges.
Layout: square, uniform THREE COLUMNS by THREE ROWS. Exactly ONE isolated part in each cell, nine total. Large transparent margins, all parts fully inside their own cells. No labels, numbers, drawn grid, floor or shadows. True alpha transparency.
ROW 1: three complete identical-size HEADS of the same robot facing camera: first calm friendly small smile; second focused confident small smile with cyan eyes looking to the RIGHT, never angry; third delighted celebratory open smile and joyful cyan eyes. All heads keep the exact same blue-and-gold helmet, ROUND GOLD GEAR forehead emblem, blue round ear covers, TWO black antennas with round tips, red Santa hat with white furry trim and white pompom. Exact same shape, proportions, angle and lighting for these three head variants.
ROW 2: first isolated WHITE ROBOTIC HAND holding the original gold-and-blue WRENCH upright, blue cuff, wrench stays a wrench. Second isolated white robotic RIGHT-SIDE HAND with blue cuff gripping a small rounded BLUE/GOLD PALM ENERGY PROJECTOR, SIDE VIEW: short horizontal barrel points EXACTLY RIGHT, round cyan muzzle located at the RIGHTMOST tip, no flash, NO front-facing barrel. Third another drawing of the SAME hand/projector combination, exactly same viewpoint, fingers bent for the short recoil pose, muzzle still horizontally RIGHT. Never attach a hand to an arm.
ROW 3: first isolated FREE WHITE ROBOTIC HAND with blue cuff in an open greeting pose, exactly FIVE fingers with natural thumb on LEFT side of palm, palm facing camera. Second same hand and cuff, five fingers slightly curved in a mid-wave greeting, naturally different finger articulation, no closed fist. Third same hand relaxing after a wave, palm three-quarter upward, five natural fingers.
Material and style: charming polished 3D game character, clean readable cartoon forms, opaque glossy white hands, blue cuffs and helmet, gold metallic trim, bright cyan eyes. Every individual object is separated from all others by truly transparent pixels.
Critical contours: clean antialiased silhouettes, zero colored fringe, isolated speckles, chromatic glow, dust or alpha noise. Render completely new clean contours rather than copying the reference's edge artifacts. NO cyan aura around heads or wrists. Interior whites remain opaque.
Avoid: torso, neck, shoulders, arms, body, extra parts, full assembled characters, stars or star-shaped sparkles, weapons in wrench hand, text, checkerboard artwork, cut-off hat/antennas/fingers, mismatching face sizes, angry expressions.
```

## 2. Render opaco limpio conservado

Objetivo: el atlas de nueve piezas del primer intento. Esta salida es la fuente elegida, de 1254×1254 px.

```text
Use case: precise-object-edit.
Edit target: the attached nine-part atlas. The artifact is unusable because of colored and white ragged pixels OUTSIDE the nine objects. Remove ALL those stray fragments by RE-RENDERING the nine objects against an opaque smooth uniform LIGHT GRAY background (#dce3e8).
Keep exact same three-by-three arrangement, identity, facial expressions, hands, wrench and side-facing projector. No new parts, no captions, no shadows, no stars, no additional grid. Background MUST be flat light gray and fully opaque including all spaces between parts. All boundaries must be smooth and continuous; no dirty alpha holes or ragged exterior pixels. Keep true object materials, including white face and white fingers. Render opaque pixels throughout the complete image, with professional studio-cutout edges.
```

## 3. Extracción con ImageGen descartada

Objetivo: la fuente opaca. Volvieron a aparecer halos y residuos. Esta variante no se carga ni se exporta.

```text
Use case: background-extraction.
Edit target: the clean nine-part TecnoIA atlas on light gray.
Change ONLY its background to actual alpha transparency. Remove all light-gray background around and between the nine isolated objects, including the hole of the wrench and between fingers and antennas. Keep the gray/white robot face and white glove interiors opaque. Preserve EXACTLY the nine objects, their positions, colors, proportions and SMOOTH CLEAN EDGES from the input. Keep the square image and 3 by 3 layout.
Do not regenerate, recolor or change the objects. All empty space must be alpha zero. No colored outline, no white specks, no texture, no ground shadows, no fake checkerboard. Keep smooth antialiased object edges without glow, fringe or ragged pixels.
```

## 4. Limpieza local autorizada y animación reproducible

El usuario eligió «Limpiar el alfa con un proceso local (recomendado)». `scripts/tecnoia-v2-art.mjs` aplica un relleno conectado a los bordes contra el fondo medido [212,223,231], tolerancia 14. Solo cambia alfa; conserva RGB, blancos interiores y uniones oscuras. Fuente, parámetros, rectángulos y SHA-256 se versionan. No se usa borrado global de píxeles blancos.

`src/game/tecnoiaV2.js` define las poses, curvas, variantes ilustradas y anclajes. `scripts/build-tecnoia-v2.mjs` produce las hojas WebP, metadatos, planchas y GIF desde esa misma fuente limpia: disparo de 12 fotogramas a 60 FPS y celebración de 60 a 24 FPS. No se generan decenas de imágenes independientes ni se incorpora aún el estudio al arcade.
