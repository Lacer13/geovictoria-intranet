# Selección de guardianes

El paso «Guardián» reúne la colección y la ficha del personaje. En escritorio se ven juntas: retrato animado grande, área, poder, descripción y recarga. La tarjeta elegida se marca y el botón siguiente muestra «Continuar con [nombre]». No se añaden estadísticas de fuerza inventadas ni se cambian poderes o costes.

La búsqueda admite nombres, áreas y poderes, con varias palabras y sin distinguir tildes. Los doce guardianes por área se pueden filtrar por ataque, protección, apoyo o movimiento. Las flechas recorren únicamente los resultados visibles. Una búsqueda vacía de resultados conserva la elección y permite limpiar los filtros.

En teléfono las tarjetas se agrupan en tres columnas. Tocar un personaje abre su ficha dentro de la página y «Volver a la colección» regresa a las tarjetas, con foco accesible. El desplazamiento respeta la opción de reducir movimiento. El selector conserva los siete movimientos de la vista previa y añade un acceso directo a «Ver poder».

Los clásicos y sus desbloqueos existentes se conservan. Tocar un personaje bloqueado solo muestra su ficha: no selecciona ni gasta Data. El botón «Desbloquear por 500 Data» exige saldo suficiente; la ficha indica cuánto falta y cuál sigue siendo la elección real. Tras desbloquearlo, nuevas selecciones no vuelven a cobrar. Los doce guardianes por área siguen disponibles desde el inicio.

Solo el guardián elegido usa su animación completa. La colección utiliza los retratos pequeños existentes y el retrato estático aparece mientras carga la animación. Al salir del paso se desmonta su vista previa para no mantenerla animada en segundo plano. No se crean imágenes nuevas ni se incorporan librerías; tampoco se modifican Firestore, rankings, escenarios o simulación.

## Verificación

- 162 pruebas generales aprobadas y compilación correcta. Tres pruebas nuevas cubren búsqueda y agrupación de los doce guardianes, navegación dentro del filtro y conservación de moneda/desbloqueos con cobro único.
- Revisión local del componente real a 1280×850 y 320×568: selección de ConectIA, vista de Ráfaga, filtro de cinco personajes de ataque, búsqueda «rafaga comercial», recuperación de resultados vacíos y selección por teclado de CierreIA.
- En la escena local con 730 Data de ejemplo, previsualizar VictorIA ST mantuvo el saldo y a ConectIA elegido. Desbloquearlo dejó 230 Data; volver a seleccionarlo no cambió ese saldo. La escena no escribe en el perfil del usuario ni se conecta a Firestore.
- El teléfono virtual mostró ancho de contenido y desplazamiento de 305 píxeles, sin desbordamiento horizontal. Se comprobó el foco en la ficha al elegir y el regreso a la colección.
- Las [capturas de la primera revisión móvil](../design/guardian-selector/ficha-320.jpg) y [tarjetas](../design/guardian-selector/tarjetas-320.jpg) preceden al último ajuste de tipografía. La última comprobación visual y la revisión integrada de la versión final no pudieron completarse: la revisión automática del navegador alcanzó un límite de uso. La compilación, las pruebas y los hashes de Hosting se verifican por separado; falta también la valoración en un teléfono físico.

[Escena local de comprobación](../design/guardian-selector/review.html). Sus 730 Data son datos de ejemplo, no recompensas ni saldos reales, y no se incluye en Hosting.
