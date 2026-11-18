# Bienvenida navideña de VictorIA

## Recursos y comportamiento

- `public/victoria-navidad.mp4`: animación de 10 segundos, H.264/AAC, 1280 × 720 a 24 fps, preparada para reproducción progresiva con `faststart`.
- `public/victoria-navidad-poster.jpg`: imagen de espera.
- `public/victoria-navidad-fondo.webp` y `public/victoria-navidad-trineo.webp`: capas de la escena; el trineo conserva transparencia.
- El audio procede del video original del proyecto, `public/Nuevo Video VictorIA.mp4`. No se generó una voz nueva ni se promete sincronización labial: es una bienvenida con animación de capas, cámara y nieve.
- La ventana aparece en el inicio una vez por sesión, permite omitirla y se puede repetir desde el botón del inicio. No interrumpe enlaces privados ni la entrada directa a Administración. El sonido comienza desactivado. Se respeta el movimiento reducido y la preferencia de pausar efectos, dejando la reproducción a petición del usuario.

## Volver a renderizar

Instala FFmpeg desde una fuente oficial o un paquete reconocido. No es una dependencia de ejecución del portal. Ejecuta `node scripts/render-christmas-welcome.mjs`; puedes indicar `FFMPEG_PATH` y `FONT_PATH`. El script conserva los originales y escribe solamente el MP4 navideño. Usa las dos capas WebP, mueve el trineo de forma independiente y añade copos en primer plano.

## Generación visual

Se utilizó la herramienta integrada de ImageGen, siguiendo la habilidad `imagegen`, con un fotograma del video original como referencia de identidad. Se preservaron casco amarillo, rostro blanco, ojos azules, auriculares y antenas. Los originales de alta resolución quedan en los artefactos locales; las capas optimizadas necesarias para reproducir el montaje se versionan en GitHub.

Prompt de la escena principal:

```text
Use case: identity-preserve. Asset type: finished cinematic 16:9 Christmas welcome key art for an existing Peruvian team intranet and an animated greeting video. Input image 1 is the identity reference of VictorIA: preserve her exact distinctive floating spherical robot head, glossy yellow helmet segments, white silver rounded face, two huge blue cyan expressive eyes, blue side earpieces and two black antennae. Create a premium charming 3D animation-film style scene: VictorIA wears a soft red Santa hat with white trim that fits around her antennae and smiles warmly toward the camera, riding inside a beautiful deep crimson Santa sleigh with elegant gold rails and trim, surrounded by a few wrapped green, red and gold gifts. Keep her identity, do not turn her into a human, do not add a human body. Her round head floats naturally above the sleigh's seat, like the original floating robot. Sleigh and VictorIA occupy the center-right of the 16:9 composition, fully visible with generous room around runners; the sleigh points left. Behind: a magical snowy evergreen forest at twilight, rich deep emerald and midnight teal sky, warm tiny gold Christmas lights, gentle falling snow, a distant full moon, snowbanks. Strong readable silhouette, cozy cinematic warm illumination on VictorIA and sleigh, subtle volumetric depth, professional polished advertising illustration. Leave the left third a calm dark emerald forest area with no text and no objects competing with UI copy. No words, no logo, no watermark, no humans, no extra robot characters. Crisp cute brand mascot, delightful and welcoming, not photorealistic people. Landscape 16:9.
```

Prompt del recorte transparente:

```text
Use case: background-extraction. Edit the supplied Christmas scene into a genuinely transparent cutout asset. Keep the entire VictorIA robot head with Santa hat and antennae, the complete red gold sleigh including all golden runners, and every wrapped gift in the sleigh. Preserve their exact appearance, cute 3D rendering, expression and relative positions. Remove all sky, moon, trees, snow landscape, ground snow, and all cast shadows outside the sleigh. Clean exact edges, real transparent alpha around the complete sleigh, not white, no checkerboard, no background. Keep the whole sleigh and its runners fully visible, no cropping. Landscape cutout, no text or new objects.
```

Prompt de la capa de fondo:

```text
Use case: precise-object-edit. This is the background plate for an animated Christmas sleigh scene. Remove VictorIA robot head and Santa hat, remove the entire sleigh, every gift, all golden rails and every shadow belonging to the sleigh. Fill their former areas with a pristine snowy clearing continuing the original snow landscape and evergreen forest. Keep the same premium polished 3D animation-film environment, deep emerald twilight forest, full moon near the top right, gently lit Christmas evergreen trees and warm tiny golden fairy lights, distant snowy mountains and inviting softly illuminated snowbanks. Leave the center and left foreground clear and spacious so a sleigh can later be composited. Wide 16:9, no characters, no sleigh, no gifts, no text, no logos, no watermark. Preserve the existing scene mood, color palette and camera angle.
```
