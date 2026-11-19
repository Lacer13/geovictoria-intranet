# ConectIA v2 · Fuente y tratamiento de transparencia

Método: ImageGen integrado; referencia de identidad: `public/characters/conectia/rig-navidad-v1.png`. La primera petición transparente conservó residuos de alfa y se descartó. Se editó la misma composición sobre fondo opaco y se conservó esa nueva fuente sin modificar en `rig-v2-fuente-opaca.png`. La limpieza local sigue el procedimiento autorizado por el usuario.

## Primera petición · Atlas de piezas

```text
Use case: identity-preserve.
Asset type: separated illustration parts atlas for ConectIA v2, a Christmas robot game animation study.
Input image 1 is the IDENTITY and MATERIAL reference: preserve THIS exact warm coral-red, pearl-white and metallic-gold robot, linked-loop forehead badge, two complete black antennae with round gold tips, Santa hat and entire pompom, cyan eyes, friendly face, coral cuffs, and its coral/gold communication beacon with a round loop. Do not copy its unwanted stray matte pixels.
Create a clean square 3 by 3 invisible grid of EXACTLY NINE separate complete illustrated parts, one part centered per equal cell, ample transparent gutters and minimum 10 percent safety margin around every silhouette. No visible grid, no text.
ROW 1: [complete head smiling and attentive] [same complete head focused with a gentle confident smile, eyes looking toward screen right, not angry] [same complete head celebrating, bright joyful open smile and happy expressive eyes]. All three heads same proportions, angle and scale, facing front three-quarter as reference, full Santa hat/antennae.
ROW 2: [one complete floating left-side robotic hand gripping the SAME coral-gold loop-topped communication beacon vertically, no redesign] [one complete floating free right-side robotic hand gripping a small friendly coral-white-gold ENERGY PROJECTOR with a distinct small CYAN circular muzzle, the barrel pointing HORIZONTALLY to screen RIGHT; side/three-quarter view, full solid palm, cuff and fingers] [the SAME hand and projector in a lightly compressed recoil grip, barrel still exactly HORIZONTAL RIGHT, no detached parts]. Projector is a playful compact round device, no realistic firearm, trigger guard, ammunition or weapon stock. Beacon and projector must be visually distinct; the beacon stays an accessory, never a weapon.
ROW 3: [complete floating five-finger open waving free hand] [same complete free hand giving a friendly thumbs-up, four naturally curled fingers and one thumb] [same complete free hand relaxed with gently curved fingers]. All hands have solid opaque pearl-white robotic palms, black articulated joints and coral-gold CLOSED cuffs.
Render polished appealing 3D game illustration matching reference, soft studio lighting and sharp silhouettes, no cartoon-style drift. Exactly three heads and six hands total; no bodies, arms, wrists extending past cuffs, necks, shoulders, legs, detached fragments, extra antennae or fingers. NO stars or star-shaped details anywhere. No lightning bolts. No glow, muzzle flash, projectile, action lines, drop shadow, scenery, labels, numbers, watermark, or background pixels. Everything outside each actual part including finger gaps and loop holes must be TRUE alpha-zero transparency; no checkerboard painted into RGB, no halo, no haze, no rectangular matte. White robot surfaces remain fully opaque. Keep all nine separate parts complete, uncropped and inside their own equal grid cells. This is an identity-preserving source atlas, not a sprite animation or a scene.
```

## Corrección · Fuente opaca conservada

```text
Use case: precise-object-edit.
Edit target: supplied ConectIA v2 nine-part atlas. Keep all NINE actual parts and their identity, anatomy, drawing, scale, camera, grid cells, proportions, colors, positions and details unchanged.
Change ONLY the unwanted background/matte treatment: produce an entirely OPAQUE image on ONE perfectly FLAT pale blue-gray background, exact RGB 212,223,231 (#D4DFE7). Eliminate ALL colored haze, red/gold/white specks, fringe, rectangular matte, floating debris and alpha-mask artifacts OUTSIDE the actual nine parts. Fill all negative spaces including finger gaps and the beacon's loop hole with the same exact uniform #D4DFE7. No gradient, glow, shadows, texture or transparency. Preserve solid white robot faces and palms, gold details and black joints, and smooth clean contours.
All nine parts must remain fully complete and separate inside the existing 3x3 invisible grid: three full heads; hand with beacon; hand aiming projector right; recoil hand/projector still horizontally right; wave hand; thumbs-up hand; relaxed hand. No extra fingers, bodies, arms, labels, lines, stars, effects or watermarks. The background alone will be removed later by a deterministic edge-connected local alpha process. Do NOT add any visual elements; correct just the backdrop and its artifacts.
```

El fondo solicitado fue #D4DFE7; el render producido se midió como [203,219,230] con variación leve. El proceso utiliza ese valor medido y tolerancia euclídea 16. Solo borra alfa del fondo conectado al borde o a la semilla interior del aro [204,470]. Se conserva RGB en la operación y no se filtran globalmente los blancos. Los parámetros, rectángulos y SHA-256 de la fuente se registran en `rig-v2-parts.json`.
