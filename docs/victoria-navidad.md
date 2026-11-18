# Bienvenida navideña de VictorIA · v4

## Diseño y animación

VictorIA conserva la cabeza y dos manos flotantes, sin torso, brazos ni cuello. Mantiene casco amarillo, rostro blanco, ojos azules, auriculares, dos antenas y gorro navideño. El trineo rojo y dorado lleva regalos y una mano apoyada en el borde.

La entrada de 3,2 segundos desplaza el trineo desde el fondo hasta el primer plano, aumenta su tamaño y desacelera suavemente. Después hay un pequeño balanceo de asentamiento. La cabeza se inclina y hace pequeños gestos alegres; la otra mano saluda de forma independiente. Copos en distintas profundidades, una sombra suave y una breve estela de destellos completan la escena.

El video usa animación de capas 2D, no un modelo 3D ni una simulación de labios. No interpola imágenes completas ni deforma la anatomía. Cada pieza tiene un área de transparencia alrededor: sus límites se encuentran en esa zona vacía, con toda la cabeza, las antenas y los dedos dentro. El encuadre conserva los elementos completos durante toda la llegada, también en móvil.

## Medios finales

- `public/victoria-navidad-rig-v4.webp`: atlas RGBA de 2172 × 724 generado con ImageGen integrado. Contiene cabeza, trineo con mano apoyada y mano de saludo separados.
- `public/victoria-navidad-fondo.webp`: bosque navideño aprobado.
- `public/victoria-navidad-saludo-v4.mp4`: video H.264/AAC, 1280 × 720, 30 fps, 14 segundos, `yuv420p` y `faststart`.
- `public/victoria-navidad-saludo-v4.jpg`: imagen de espera extraída del video a los 6,2 segundos.
- `public/victoria-navidad-saludo-v4.vtt`: descripción de la música y las acciones, activada inicialmente.

El usuario prefiere incorporar su propia voz más adelante diciendo «¡Jo, jo, jo! ¡Feliz Navidad!». Esta publicación contiene únicamente la composición instrumental original de celesta, arpegios y cascabeles sintetizados de `scripts/christmas-music.mjs`, con salida progresiva al final. No se incluye voz sintética ni grabaciones musicales externas. La prueba de voz sintética quedó fuera de los recursos publicados.

## Reproductor y acceso

**Video de VictorIA** permanece en el menú de todas las secciones y en el menú móvil. En **Mi inicio**, el banner navideño ofrece **Ver saludo de VictorIA**.

Comienza sin sonido. **Ver con música** lo reinicia con música después de un clic. Se puede pausar, silenciar, activar u ocultar subtítulos, avanzar y repetir. Al terminar permanece abierto con el personaje visible. **Entrar a mi intranet**, **Saltar bienvenida** o Escape lo cierran y restauran el foco.

Se respeta movimiento reducido y la preferencia de pausar efectos: el video espera una reproducción manual. La bienvenida automática aparece una vez por sesión en el inicio. Se actualiza la clave de sesión a v4, pero se conserva la preferencia previa de no mostrarla automáticamente durante esta Navidad. Los enlaces privados y Administración abren directamente.

## Render reproducible

Requiere Node y FFmpeg con libx264, libwebp y drawtext. No añade dependencias al sitio; los medios finales están versionados. Ejecuta:

```sh
FFMPEG_PATH=/ruta/a/ffmpeg node scripts/render-christmas-welcome.mjs
```

También admite `FONT_PATH` y `WELCOME_OUTPUT`. Por defecto produce el MP4 y la imagen de espera v4. Los archivos temporales se eliminan al terminar.

### Incorporar la voz del usuario después

Se admite una grabación local mediante `WELCOME_VOICE`, sin servicio de pago ni credenciales:

```sh
WELCOME_VOICE=/ruta/a/grabacion.m4a FFMPEG_PATH=/ruta/a/ffmpeg node scripts/render-christmas-welcome.mjs
```

La grabación comienza a los 4 segundos, después de la llegada. Debe caber antes del cierre a los 14 segundos. El render normaliza su volumen y baja automáticamente la música cuando detecta la voz. Cuando se incorpore la grabación aprobada, también habrá que actualizar el archivo VTT con las palabras y los tiempos reales, y el texto del botón del reproductor para indicar que incluye voz. No se solicita grabarla ahora ni se imita su voz.

No se modifican las poses ni el video v3 aprobado. Se conservan como recursos anteriores.

## Prompt del atlas final · herramienta integrada ImageGen

Referencia: `public/victoria-navidad-pose-a.webp`. Se utilizó el modo integrado con `transparent_background: true`, sin CLI ni claves API.

```text
Use case: stylized-concept. Asset type: production animation SPRITE ATLAS with THREE SEPARATE RIG PARTS for the exact approved VictorIA Christmas mascot in reference. Wide panoramic canvas, ideally 3072 x 1024 (3:1). GENUINE TRANSPARENT BACKGROUND. Divide canvas mentally into THREE EQUAL VERTICAL COLUMNS, no drawn borders or labels. COLUMN 1: ONLY the complete floating robot HEAD, frontal same slight three-quarter perspective as reference: whole red Santa hat and white pompom, BOTH complete black antennae, yellow helmet, blue ear pieces, white silver face, two friendly cyan eyes and smiling mouth. NO neck, body, arms or hands in column 1. COLUMN 2: ONLY the entire reference red and gold SLEIGH WITH GIFTS, velvet cushions and the one lower resting floating robot hand at its front rim. Both WHOLE gold runners fully visible. NO HEAD, no antennae, no hat and no raised waving hand in this column. Empty open space above cushions. COLUMN 3: ONLY the complete raised white robotic WAVING HAND, open palm facing us, all five entire fingers, all joints and the WHOLE solid opaque palm and small blue closed wrist cuff. No forearm or arm. Each of these THREE objects must be independently centered and ENTIRELY WITHIN ITS OWN COLUMN with generous transparent padding 8% around every object. There MUST be generous empty transparent space separating all THREE columns so a video renderer can take each rectangular column without cutting any part. The objects must NEVER overlap the column boundaries. Keep exact approved reference 3D rendering, materials, red white gold blue palette and lighting. VictorIA is ONLY A FLOATING HEAD AND TWO FLOATING HANDS, no torso, neck, shoulders, arms or forearms, ever. Solid opaque head and palms, no holes. Cutout edges must be clean, NO ambient glow, NO soft colored glow, NO background shadows, NO forest, NO sky, NO snow, NO floor, NO background color, NO text, NO labels, NO extra sprites or characters, NO grid, NO checkerboard. Only the three specified isolated rig parts on real transparency.
```

El resultado tiene columnas de anchos distintos. El render utiliza los límites reales de las piezas y reduce únicamente el halo de transparencia tenue del margen; no elimina partes sólidas del personaje. La primera prueba de un trineo completo con fondo transparente se descartó: el atlas ofrece movimiento independiente más controlado.
