# Misiones, jefes y minijuegos

Implementación del 27 de noviembre de 2026, sin servicios ni recursos de pago nuevos.

**Publicado:** el PR #15 se fusionó con autorización del usuario y la versión probada `b412e75695e84b52` está activa en [el juego principal](https://geovictoria-intranet-peru.web.app/juego). [Abrir minijuegos](https://geovictoria-intranet-peru.web.app/juego#minijuegos). Se comprobaron 70 recursos por SHA-256 y la navegación de aventura y ambos minijuegos en producción, sin errores de consola ni envío de puntajes de prueba. [Registro y restauración](releases/misiones-minijuegos-production-2026-11-27.json).

## Aventura

Se mantienen los tres niveles, el orden de desbloqueo y el progreso existente. Cambia la forma de superar sus objetivos:

| Nivel | Objetivo | Estrategia del jefe |
| --- | --- | --- |
| Bosque | Recuperar seis regalos que llegan por distintas alturas; los perdidos vuelven a aparecer. La señal llega a los 90 segundos. | Centinela: su escudo alterna entre cerrado y abierto. Esperar la apertura para hacer daño. |
| Taller | Permanecer 2,5 segundos dentro de cada una de las tres balizas, disponibles a los 15, 45 y 75 segundos. Se conserva la reparación parcial. La señal llega a los 105 segundos. | Forjador de Escarcha: alterna abanicos de dos y tres disparos. Buscar el hueco anunciado. |
| Faro | Acompañar el núcleo dentro de su radio durante 120 segundos de avance. Espera al alejarse el jugador. | Desfase: ráfagas de uno, tres y cinco disparos según su energía. |

La señal y el objetivo deben cumplirse para que aparezca el jefe. Los puntos por sí solos no permiten saltarlos. Los tres jefes reutilizan la animación ilustrada existente con tonos, nombres y estrategias diferentes; no son tres modelos ilustrados nuevos. Los carriles anticipados coinciden con los disparos físicos. Arcade conserva su comportamiento anterior.

## Minijuegos

En `/juego`, elegir **Minijuegos**, escribir un nombre o alias y seleccionar un reto. También se puede abrir `/juego#minijuegos`.

- **Memoria de guardianes:** doce cartas, seis parejas. El reloj empieza con la primera carta. Dos cartas diferentes se cierran después de una breve espera; las parejas encontradas se conservan. Menos intentos y tiempo producen más puntos.
- **Faro de reflejos:** tocar el faro encendido durante 30 segundos de juego. También admite las teclas 1–9. Los aciertos rápidos y las rachas suman más; un botón apagado resta dos puntos sin bajar de cero.

Ambos permiten pausar y se pausan al ocultar la pestaña. Salir abandona ese intento. Los mejores resultados se guardan **solo en ese navegador**, sin tabla pública ni recompensa de Data. Se informa si el navegador impide guardarlos. La aventura y Arcade mantienen sus tablas compartidas.

## Validación

- 157 pruebas generales aprobadas y compilación de producción correcta.
- Campaña completa con las tres vidas normales y controles legítimos simulados; sin modificar salud ni daño. Pruebas de escudo, fases, objetivos, orígenes de disparo y conservación de Arcade.
- Memoria completada desde la interfaz: seis parejas, nueve intentos, resultado y récord local. Reflejos comprobado por teclado y clic, pausa estable, fin de los 30 segundos, resultado y récord de 62 puntos visible al volver al menú.
- Revisión a 320×568: sin desbordamiento horizontal; los nueve botones de reflejos caben en pantalla y miden aproximadamente 81×72 píxeles. Vista temporal restablecida después.
- Objetivos y jefes inspeccionados con la [escena local de revisión](../design/gameplay/revision.html). Esa escena protege al jugador únicamente para observar; no publica puntos ni se incluye en Hosting.
- No se enviaron resultados de prueba a producción. La comodidad de los nuevos retos en un teléfono físico sigue pendiente; la revisión del navegador no mide FPS ni sustituye esa prueba.

[Memoria en móvil](../design/gameplay/memoria-320.jpg) · [Reflejos en móvil](../design/gameplay/reflejos-320.jpg) · [Bosque](../design/gameplay/bosque-jefe.jpg) · [Taller](../design/gameplay/taller-jefe.jpg) · [Faro](../design/gameplay/faro-jefe.jpg).
