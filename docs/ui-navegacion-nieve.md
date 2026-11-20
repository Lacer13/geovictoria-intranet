# Navegación y ambiente visual

20 de noviembre de 2026. La entrega busca más espacio para el contenido y una Navidad legible sin recargar la pantalla.

[Vista previa de la interfaz](https://geovictoria-intranet-peru--ui-navidad-sbzukf0q.web.app/navidad), disponible hasta el 27 de noviembre. El portal principal conserva su versión anterior hasta integrar y publicar esta entrega. [Registro y huellas de la vista previa](releases/ui-navidad-preview-2026-11-20.json).

## Cambios

- La barra lateral deja de ocupar una columna fija. **Menú** abre la navegación en computadora y teléfono; el fondo queda fuera de interacción hasta cerrarla. Escape, el botón de cierre y el fondo permiten salir. Seguir un enlace cierra el panel, y Administración queda al pie mientras la lista central puede desplazarse.
- El encabezado conserva logo, sección actual, búsqueda y novedades. **Ajustar vista y efectos** reúne tema y ambiente; se retiran insignias redundantes y el perfil decorativo sin acciones.
- Los puntos se sustituyen por copos SVG de seis brazos. **Suave**, el valor inicial, distribuye 16 copos sobre todo hacia los bordes y mantiene las luces tranquilas. **Festivo** utiliza 26 y un brillo discreto. En móvil se muestran como máximo 8 o 12 respectivamente. **Decoración quieta** no genera copos y pausa los detalles estacionales.
- El tema y el ambiente se recuerdan en este navegador. `geoChristmasAtmosphere` conserva la selección nueva; si no existe, una pausa anterior en `geoChristmasMotion` se respeta. Bloquear almacenamiento no impide usar la interfaz. La preferencia de reducir movimiento del dispositivo mantiene la nieve oculta y elimina transiciones.
- El juego y la pantalla de proyección del concurso conservan sus rutas inmersivas sin encabezado, panel lateral o nevada.

## Comprobación

104 pruebas del portal correctas, incluida la migración de preferencias antiguas o inválidas; compilación y lint correctos. Las reglas de Firestore y los servicios de juego no cambian.

Revisión local en navegador:

- Escritorio: contenido desde el borde izquierdo, sin columna reservada para el menú ni desplazamiento horizontal; 16 SVG en Suave, 26 en Festivo y cero puntos.
- Menú: abrir, recorrer con Tab y Shift+Tab, cerrar con Escape, recuperar el foco del botón y seguir un enlace al directorio con cierre automático.
- Ajustes: claro/oscuro, pausa de nieve y recuperación de la selección después de recargar. Búsqueda mediante Ctrl+K y navegación desde sus resultados.
- 320 × 568: encabezado y ajustes sin desbordamiento horizontal, ocho copos visibles en Suave, menú con desplazamiento y acceso fijo a Administración. Se restableció el tamaño del navegador al terminar.
- `/juego`: selector de tres misiones y arena visibles, sin controles de navegación o nieve superpuestos.

Capturas: [escritorio](../design/ui/2026-11-20/escritorio.jpg), [ajustes](../design/ui/2026-11-20/ajustes.jpg), [móvil](../design/ui/2026-11-20/movil.jpg), [menú móvil](../design/ui/2026-11-20/menu-movil.jpg), [ajustes móviles](../design/ui/2026-11-20/ajustes-movil.jpg).

En la vista previa pública se compararon 18 recursos por SHA-256 y las rutas de Navidad, directorio y juego. Se comprobó el menú y su cierre, los ajustes y el modo Festivo a 320 × 568: doce copos visibles, sin desbordamiento horizontal. Se restauró Suave y el tamaño habitual del navegador. [Captura pública](../design/ui/2026-11-20/preview-publica.jpg).
