# Bienvenida navideña de VictorIA

## Diseño y recursos finales

VictorIA conserva su cabeza y dos manos flotantes, sin torso, brazos ni cuello. Su identidad mantiene casco amarillo, rostro blanco, ojos azules, auriculares, dos antenas y gorro navideño. La escena incluye trineo rojo y dorado, regalos y bosque nevado.

Se generan tres escenas completas y coherentes: saludo abierto, variación de la mano y guiño. No se recortan partes del personaje del video original ni se eliminan fondos grises. El encuadre del reproductor conserva toda la escena también en móvil.

- `public/victoria-navidad-pose-a.webp`, `public/victoria-navidad-pose-b.webp`, `public/victoria-navidad-pose-c.webp`: poses completas de la escena.
- `public/victoria-navidad-saludo-v3.mp4`: video H.264/AAC, 1280 × 720, 24 fps, 12 segundos, con `faststart`.
- `public/victoria-navidad-saludo-v3.jpg`: imagen de espera del video terminado.
- `public/victoria-navidad-saludo-v3.vtt`: subtítulo descriptivo de la música.

La música es una composición instrumental creada para esta bienvenida: celesta, arpegios y cascabeles sintetizados; no utiliza muestras ni grabaciones externas y no contiene voz. Su fuente está en `scripts/christmas-music.mjs`.

## Cómo volver a verlo

**Video de VictorIA** permanece en el menú de todas las secciones. En **Mi inicio** hay una tarjeta con miniatura y el botón **Ver video de VictorIA**, antes del banner navideño. El menú móvil conserva el mismo acceso.

La bienvenida automática aparece una vez por sesión al abrir el inicio. Comienza sin sonido; **Ver con música** lo reinicia con audio mediante un clic. Se puede pausar, avanzar y repetir. Al terminar permanece abierta con el personaje visible. **Entrar a mi intranet**, **Saltar bienvenida** o Escape la cierran y devuelven el foco al control anterior.

Se respeta movimiento reducido y la preferencia de pausar efectos. Los enlaces privados y Administración no abren una bienvenida automática, pero el acceso manual funciona sin cambiar de página.

## Render

Requiere Node y FFmpeg con libx264/drawtext. No son dependencias nuevas del sitio ni del despliegue: los medios finales ya están versionados.

Ejecuta `node scripts/render-christmas-welcome.mjs`. Puedes indicar `FFMPEG_PATH`, `FONT_PATH` o `WELCOME_OUTPUT`. El script intercala las poses completas mediante interpolación de movimiento, añade copos y la música original, y elimina únicamente sus archivos temporales. No altera las imágenes ni los videos originales del proyecto. Para actualizar la imagen de espera, extrae un fotograma del MP4 terminado.

## Generación de imágenes

Se utilizó ImageGen integrado siguiendo la habilidad `imagegen`. Estos son los prompts de las poses definitivas, con la escena completa como referencia. Las capas y pruebas descartadas no forman parte del reproductor.

### Pose A: cabeza y manos flotantes

```text
Use case: precise-object-edit. Keep this entire finished Christmas illustration exactly as it is, EXCEPT REMOVE the robot's torso, chest, neck, shoulders, upper arms and forearms. VictorIA's approved design is ONLY A FLOATING HEAD AND TWO FLOATING HANDS: NO BODY, NO TORSO, NO SHOULDERS, NO ARMS, NO NECK. Preserve the complete round robot head, yellow helmet, white silver face, both cyan eyes, smile, blue earpieces, two whole black antennae and red Santa hat EXACTLY unchanged in their current positions. Preserve both COMPLETE white robotic hands, every finger, each SOLID OPAQUE PALM and their small closed blue wrist cuffs, in the exact same positions. The right hand is raised waving and the other hand rests near the front rim. Make the hands intentionally float independently, with no arm or forearm attached and clean finished blue cuff ends, no cut-off stump appearance. Remove all visible body and arm material between the head and hands and fill those former body regions naturally with the red velvet seat, cushions or the background that belongs behind them. Preserve the exact same camera, full 16:9 canvas, scene geometry, sleigh including complete gold runners, presents, forest, moon, snow, lighting and all decorations. No other changes. Never erase parts of a palm or the face, never create transparency within any robot part. Return the whole complete illustration with the floating-head-and-hands mascot only.
```

### Pose B: saludo

```text
Animation keyframe B, precise minimal edit. Preserve the supplied full Christmas scene EXACTLY: same fixed 16:9 camera, background, moon, snow, forest lights, sleigh, gold runners, presents, floating robot head, both black antennae, yellow helmet, blue earpieces, Santa hat, face and the lower floating hand, all the same positions and sizes. Change ONLY the raised floating hand on the VIEWER'S RIGHT: rotate the ENTIRE complete hand and small blue cuff about 12 degrees inward toward the head, keeping its palm facing us and all five COMPLETE solid white fingers and the entire opaque palm visible, without touching the hat pompom. Both eyes remain open. VictorIA is ONLY A FLOATING HEAD AND TWO FLOATING HANDS: NO torso, NO body, NO neck, NO shoulders, NO arms and NO forearms. Never connect the hands to a body. No transparent holes in the hands or face, no cropping and no missing robot parts. Do not change any other area or the camera. Return the whole finished frame.
```

### Pose C: guiño

```text
Animation keyframe C, precise minimal edit. Keep the supplied full Christmas scene EXACTLY unchanged: same fixed 16:9 camera and composition, every snowflake, background, moon, trees, lights, sleigh and gold runners, gifts, complete floating robot head, yellow helmet, two complete antennae, blue earpieces, Santa hat and both floating hands in the exact same positions. Change ONLY the expression to one friendly wink: close the eye on the VIEWER'S RIGHT into a cheerful curved eyelid while the other cyan eye remains open and the smile stays warm. The raised floating hand remains complete with all five whole white fingers and SOLID OPAQUE PALM. VictorIA has ONLY A FLOATING HEAD AND TWO FLOATING HANDS: NO body, torso, neck, shoulders, arms or forearms. No missing parts, no transparent holes, no cropping, no other changes. Return the entire finished frame.
```
