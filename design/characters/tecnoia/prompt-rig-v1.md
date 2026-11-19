# Prompt del atlas de TecnoIA

Método: ImageGen integrado, fondo transparente. Referencia de identidad: `concept-navidad-v1.png`. Resultado final: `public/characters/tecnoia/rig-navidad-v1.png`, PNG RGBA de 1254 × 1254. No se usó CLI ni clave API.

Los rectángulos de origen se ajustaron al contenido real de cada pieza mediante Canvas, con margen. La imagen generada se conserva sin alteraciones; no se presupone que la cuadrícula solicitada sea perfecta.

```text
Use case: identity-preserve.
Asset type: transparent game rig atlas for the approved TecnoIA Christmas character.
Input image: the supplied image is the ONLY character identity reference. Preserve its friendly silver white face, cyan eyes, cobalt blue and gold gear helmet, red white Santa hat, both black antennae, materials and polished 3D style.
Primary request: reorganize this SAME character into a clean animation parts atlas, with exactly a 2 by 2 invisible grid of equally sized square cells. A game engine will use the exact quarter-cell rectangles. Place each COMPLETE part entirely in its own cell, centered with at least 10 percent empty margin from EVERY cell edge. No parts may cross a cell boundary.
Top left quarter: ONLY the complete floating head including full hat pompom, BOTH complete antennae and earpieces. No neck, no hands in this cell.
Top right quarter: ONLY the complete floating tool-gripping hand with opaque closed blue wrist cuff and the ENTIRE normal gold blue open-ended repair wrench; no stars inside the open jaw. All fingers and wrench fit completely inside the cell.
Bottom left quarter: ONLY the complete open waving floating hand with five complete fingers, opaque solid palm and closed blue cuff, matching the reference.
Bottom right quarter: entirely transparent, empty.
There must be exactly one head and exactly two hands total, no duplicates. Do not add a body, arms, torso, neck, shoulders, legs or any new accessory. No stars or sparkle-shaped effects anywhere. Preserve the reference character design, not a redesign. No text, labels, grid lines, backgrounds, shadows on background or watermark. Every empty region is genuine alpha transparency, including around the cells. Clean edges, no colored debris, no cropping. All parts are shown in the same front three-quarter pose as the reference for a reusable articulated 2D game rig.
```
