# Desplazamiento sin barras visibles

La plataforma oculta las barras verticales y horizontales tanto de la página como de sus paneles internos, en móvil y escritorio. La hoja global `scrollbars.css` usa `scrollbar-width: none` y `::-webkit-scrollbar`; se elimina la excepción del menú que pedía una barra fina. No se cambia `overflow`, el desplazamiento táctil, la rueda ni las teclas de navegación.

Revisión de la versión integrada en Hosting:

- A 320×568, el selector de personajes ocupa los 320 píxeles útiles sin desbordamiento horizontal. La barra no aparece y el gesto de desplazamiento mueve la página de 0 a 424 píxeles; Fin alcanza el final.
- El menú mantiene `overflow-y: auto`, sin barra visible. Se puede desplazar hasta «Pausa activa»: 263,2 píxeles de recorrido, con 581 de contenido y 318 de alto visible.
- A 1280 píxeles, Navidad en equipo conserva el desplazamiento con teclado hasta el pie, sin barra visible ni desbordamiento horizontal.
- Sin errores de consola durante la revisión. Se restaura el tamaño de ventana al terminar. No se crean saludos, partidas ni puntajes durante las pruebas. Falta valoración en un teléfono físico.

Los registros de Hosting y hashes están en `docs/releases/scroll-sin-barras-preview-2026-11-27.json` y, tras publicar, su registro de producción.
