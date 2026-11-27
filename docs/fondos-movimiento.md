# Fondos con movimiento más visible

**Publicado el 27 de noviembre de 2026:** el PR #17 está fusionado y la versión probada `bcc2541b33b02779` está activa en [el juego principal](https://geovictoria-intranet-peru.web.app/juego), con autorización del usuario. Pasaron 159 pruebas generales, 53 de permisos y compilación en GitHub Actions. Los 70 recursos verificados coinciden con la vista previa por SHA-256. Se recargó el juego principal y se confirmó la entrada nueva sin errores de consola. [Registro con restauración](releases/fondos-movimiento-production-2026-11-27.json).

Se conservan las tres ilustraciones del Bosque, Taller y Faro y su tamaño de descarga. La cámara se desplaza más que antes; niebla baja, nieve y primer plano avanzan a distintas velocidades para dar sensación de recorrido. Los elementos próximos pasan de derecha a izquierda. El taller añade faroles y el faro un haz de luz suave con barrido lento. La cámara del faro mantiene su torre visible.

El movimiento es decorativo y se dibuja antes de los personajes, enemigos y proyectiles. No cambia la simulación, las colisiones, los objetivos, los puntajes ni los controles. No añade librerías, solicitudes de red ni ilustraciones nuevas. Las cantidades de copos y elementos están acotadas; no se crean superficies intermedias por fotograma.

Al pausar la partida, el tiempo del escenario se detiene con la simulación. Activar «Reducir movimiento y efectos» conserva una imagen estática: cámara, nieve, ambiente, primer plano y haz quedan quietos. Se mantiene el fondo alternativo si una ilustración no carga.

## Revisión

- Las pruebas de render comparan los tres escenarios con movimiento normal y reducido, y verifican que no aparezcan bordes transparentes durante el recorrido de cámara, incluso en formato vertical. El contexto de Canvas se restaura tras el dibujo.
- La revisión local comprobó cambio de fotogramas con movimiento normal y capturas idénticas con movimiento reducido mientras el reloj seguía activo. No hubo errores de consola.
- Revisión a 1280×800 y 844×390; el ancho de página y contenido horizontal coincide. Falta la valoración de fluidez en un teléfono físico; los tiempos de dibujo de Node/Skia no se presentan como FPS móviles.
- [Escena de revisión local](../design/scenery-motion/index.html), [Bosque](../design/scenery-motion/bosque-horizontal.jpg), [Taller](../design/scenery-motion/taller.jpg) y [Faro](../design/scenery-motion/faro.jpg). La escena local no se incluye en Hosting y no registra puntajes.
