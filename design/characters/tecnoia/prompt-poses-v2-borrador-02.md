# Prompts · TecnoIA v2 · Borrador 02

19 de noviembre de 2026. Herramienta integrada ImageGen, sin API ni CLI adicional. Se mantienen los borradores anteriores.

## Segundo borrador conservado

Referencias: primera lámina con alfa `poses-v2-borrador-01-alpha.png` (objetivo de edición) y `public/characters/tecnoia/rig-navidad-v1.png` (identidad). Salida copiada al proyecto como `poses-v2-borrador-02.png`. La petición de 2048×1024 no se presupone cumplida: el PNG obtenido mide 1774×887 y se inspecciona antes de definir rectángulos.

```text
Use case: identity-preserve.
Asset type: revised key-pose design sheet for TecnoIA v2, a Christmas arcade game. This is source art for later animation, not an already animated sprite sheet.
Input image 1 is the edit target: the eight-pose design sheet. Input image 2 is the approved identity reference only: the original atlas of separate head, wrench hand and open hand.
Primary request: cleanly redraw the EIGHT complete-character poses from image 1 with consistent proportions and pristine transparent contours. Preserve the four-columns by two-rows arrangement and the action order. Use a wide 2048 by 1024 composition if possible, uniformly spaced cells, each character fully contained with at least 7 percent transparent margin. No numbers, captions or any text.
Identity: exactly one floating cheerful robot HEAD and TWO detached floating white robotic HANDS per pose. Blue and gold helmet with a round gold gear emblem, two slim black antennas with round tips, cyan eyes, red Santa hat, white furry trim. Keep face, hat, wrench and materials close to image 2. No torso, neck, shoulders, arms, legs or connecting limbs. The wrench remains in the LEFT side hand; ONLY the free hand on the RIGHT side holds a compact rounded BLUE-AND-GOLD energy projector with a CYAN ROUND muzzle pointing horizontally RIGHT. This is playful, friendly cartoon technology.
Top row left to right: idle with relaxed free hand; aiming with projector; emission with projector and a very SHORT restrained cyan muzzle glow; recoil with the projector hand drawn slightly back. Bottom row: recovery returning to aim; dodge with hands tucked and alert face; victory with joyful eyes, open smile, wrench raised and free hand waving with exactly five natural robotic fingers; peaceful rest with hands lowered.
Targeted correction: aiming, emission, recoil and recovery have calm confident focused eyes and a small determined smile, never angry eyebrows, bared teeth or shouting mouth. Different finger articulation and facial expressions communicate the action. Retain exactly the same head size across poses except the slight dodge tilt.
Transparency requirements: actual alpha zero throughout all empty spaces, clean antialiased edges, NO colored fringe, speckles, white dust, dirty pixels, glow around the silhouette, floor, shadow panel, checkerboard artwork or background texture. Keep gold, blue and white opaque within the character. All antennas, hat, pompom, wrench and fingers complete within their cells.
Avoid: stars or star-shaped highlights, weapons replacing the wrench, extra fingers, extra detached parts, additional characters, angry expressions, text, drawn grid, boxes, ground shadows.
```

## Intento posterior de limpieza descartado

Objetivo: segundo borrador. Se pidió una corrección exclusiva de contornos. Persistieron franjas de color y píxeles sueltos; la variante no se eligió ni se utiliza en el exportador.

```text
Use case: background-extraction.
Edit target: the attached TecnoIA eight-pose sheet. Perform ONE targeted correction: replace the dirty colored contour fringes and floating speckles with clean professional alpha edges. Every red, cyan, blue, gold and white isolated fleck outside the actual character silhouette must disappear. Remove the bright cyan fringe beside heads and behind hands. Preserve the opaque interior white face, white robotic fingers and furry Santa hat trim.
Do not change the actual poses, layout, scale, facial expressions, count of characters, costume or projector. Exactly eight complete floating-head-and-two-hands characters in 4 columns and 2 rows, same coordinates as input, no added labels. All empty background between heads, tools and hands must be alpha zero. No floor, no matte, no drop shadow, no checkerboard. No stars. This is a clean cutout image for a game. Keep antennas and every fingertip complete.
```

## Resultado y límites

El segundo borrador suaviza el gesto de combate y permite revisar ocho poses de forma separada, pero no satisface todavía los criterios de contorno limpio, continuidad y boquilla horizontal definitiva. No es una secuencia de disparo ni de celebración completa. La extracción determinista usa Canvas para recortar, escalar y empaquetar sin retocar el alfa ni borrar colores; el juego conserva v1.
