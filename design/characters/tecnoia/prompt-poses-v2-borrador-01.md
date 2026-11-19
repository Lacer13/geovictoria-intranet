# Prompts · TecnoIA v2 · Borrador 01

Método: herramienta integrada ImageGen, sin API ni CLI adicional.

Referencia de identidad: `public/characters/tecnoia/rig-navidad-v1.png`.

## Generación de poses

```text
Use case: identity-preserve.
Asset type: FIRST KEY-POSE DESIGN SHEET for TecnoIA v2 in an existing Christmas arcade game, not a final animated spritesheet.
Reference image: the provided local PNG is the approved atlas of TecnoIA's head, wrench hand and open hand. Use it ONLY as identity, material and color reference, not as the desired sheet layout.
Primary request: create one polished transparent landscape contact sheet with EXACTLY EIGHT COMPLETE CHARACTER POSES arranged in a uniform FOUR COLUMNS by TWO ROWS grid, all cells same size. Each cell depicts the ENTIRE character: ONE floating head and exactly TWO detached floating hands, with no body or limbs. Retain enough clear margin within each cell. All eight show the SAME character proportions, scale, blue and gold helmet with yellow gear emblem, two black antennas, cyan eyes, red Santa hat with white trim, glossy white robotic hands with blue cuffs. Preserve the original premium cheerful 3D style.
Pose order left to right:
Top row 01 idle: relaxed face, wrench hand low at left and free hand at right relaxed;
02 aiming: focused eyes, free hand on the right extends a small compact blue-and-gold palm energy projector with a clearly visible round cyan muzzle aimed horizontally RIGHT, other hand holds the original wrench;
03 emission: same aiming direction, visible round muzzle with a SHORT restrained cyan flash, focused determined mouth, original wrench retained;
04 recoil: projectile hand recoils visibly, fingers and head react subtly, eyes remain focused, muzzle still points right, wrench retained.
Bottom row 05 recovery: muzzle cools, shooting hand returns from recoil to aiming, original wrench;
06 dodge: head leans and both detached hands tuck in close with alert eyes, no connecting arms;
07 victory: bright joyful eyes and open smile, one hand lifts original gold-and-blue wrench, free hand visibly waves with five correct fingers, projector stowed;
08 rest: hands lower and face peacefully smiles after victory.
The new compact projector belongs ONLY to the FREE HAND; the WRENCH STAYS A WRENCH. Keep all fingers, hat, pompom, antennas and wrench inside their cells. Head remains dominant and recognizable at game size; each hand is about one third of head width. Poses must use actual differing finger/palm and expression drawings, not merely rotate one identical hand.
Under each pose place ONLY a small clear two digit number 01 through 08, near its cell bottom, with ample separation from the character. No other text.
Constraints: genuinely transparent background, clean alpha, no ground, no shadows forming a panel, no boxes, no grids drawn, no checkerboard artwork, no torso, neck, shoulders, arms, legs, weapons held in the wrench hand, stars or star shaped sparkles. No extra characters or parts. No cropping. This is a sequential design review sheet, not an atlas of separated pieces.
```

## Extracción de fondo

```text
Use case: background-extraction. Edit target: the provided eight-pose TecnoIA contact sheet.
Change ONLY the background: REMOVE all of the white/light-gray background and any paper/checker texture completely. Output actual PNG alpha transparency, zero alpha between characters and in every empty space; the result must be a transparent cutout sheet.
Preserve exactly the eight poses in the existing 4 by 2 layout, the blue and gold robot heads, detached white hands, red Santa hats, wrenches, compact projectors, expressions, the small cyan muzzle flash in 03 and black numeric labels 01 to 08. Do not redraw or modify the character's design. Do not add a background of any color. Do not fake transparency with a checkerboard. Preserve original sheet dimensions and cell positions.
```

La segunda llamada utiliza la primera lámina como referencia. Ambas imágenes se conservan como borradores para revisión, sin sustituir recursos de producción.
