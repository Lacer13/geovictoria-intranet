# Escenarios y puntajes · Verificación

Estado: implementado y probado localmente; publicación pendiente.

| Comprobación | Resultado |
| --- | --- |
| Arte | Tres originales PNG de ImageGen integrado, prompts y huellas conservados. WebP de 1440×810: 80.690, 101.738 y 59.962 bytes. Miniaturas de 480×270. |
| Render | Escenas distintas sin tapar la acción, movimiento reducido y fondo dibujado de respaldo. Simulación y personajes conservados. |
| Nombre | Validación antes de iniciar, alias visible en HUD, preferencia local y funcionamiento con almacenamiento bloqueado. |
| Tablas | Tres niveles y Arcade separados. Selector independiente del desbloqueo, 20 mejores partidas, empates con puesto compartido. |
| Publicación aislada | El componente real guardó 240 puntos de «QA Escenarios» en el emulador. Otra pestaña de `/juego` mostró nombre y puntaje. Un doble clic en el faro dejó una sola fila de esa partida. |
| Móvil emulado | Formulario y tabla a 320×568, ancho cliente y desplazable de 305 px. Alias visible y controles a 844×390. |
| Datos | Solo se publicaron pruebas en `demo-geovictoria`, puerto local 8194. No se enviaron puntajes a producción. |
| Restauración | Partidas abandonadas, nombre de prueba retirado del formulario, viewport y movimiento reducido restablecidos. |
| Pruebas | 148 generales, 52 de permisos y compilación aprobados. Seis regresiones nuevas de escenas/nombres/tablas y dos de permisos de niveles. |
| Teléfono real | Aceptación posterior pendiente. Sin medición de FPS ni memoria física. |

Capturas: [bosque y HUD](../design/scenery/ui-bosque-horizontal.jpg), [nombre móvil](../design/scenery/ui-nombre-ranking-320.jpg), [tabla compartida](../design/scenery/ui-ranking-compartido-320.jpg), [taller](../design/scenery/ui-taller.jpg), [faro](../design/scenery/ui-faro.jpg). Consolas del juego y revisión sin errores ni advertencias.

La vista previa de Hosting comparte Firestore con producción. Las nuevas tablas de niveles requieren publicar las reglas de este cambio; hasta entonces se puede revisar la interfaz y los escenarios y puede aparecer el aviso de tabla no disponible. El flujo completo se comprobó con el emulador. Arcade conserva su colección y reglas anteriores.
