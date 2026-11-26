# Saludos navideños en las invitaciones

26 de noviembre de 2026. La invitación privada incorpora una escena breve con uno de los doce guardianes del juego, un árbol de Navidad y un reno que saluda con una patita.

## Experiencia

- Se elige un guardián al abrir cada invitación. Si el navegador permite almacenamiento de sesión, se evita repetir el de la visita anterior. Revelar u ocultar el resultado no cambia el personaje durante esa visita.
- El guardián coloca una esfera en el árbol; después saluda y el reno lo acompaña. La escena dura 7,6 segundos de reproducción y termina en una pose quieta, sin sonido.
- **Pausar saludo**, **Continuar saludo** y **Repetir saludo** controlan solo la decoración. El resultado puede descubrirse desde el principio.
- La preferencia del dispositivo para reducir movimiento y **Ajustar vista → Decoración quieta** muestran la pose final sin reproducción automática. Al volver a una decoración animada, el saludo no se reinicia sin pulsar Repetir.
- La reproducción se pausa cuando la escena queda fuera de la vista o la pestaña está en segundo plano. Se limita a 30 cuadros por segundo.
- Se usan las cabezas y manos originales, con sus gorros y accesorios navideños. No se alteran los archivos ni las animaciones del juego. El árbol y el reno se dibujan con Canvas.

## Aislamiento respecto al sorteo

El componente decorativo no recibe la tarjeta, el enlace, el nombre del destinatario ni las asignaciones, y no importa Firestore. Solo recibe datos públicos del catálogo de personajes. El recuerdo de sesión contiene exclusivamente el identificador del personaje; no contiene nombres ni enlaces privados.

La invitación conserva su consulta y sus controles de revelar, ocultar y copiar el enlace. El saludo carga bajo demanda con un límite de espera de ocho segundos; no bloquea la tarjeta. Si falla su imagen, aparece un saludo estático con la miniatura existente. Una barrera de errores propia evita que un fallo de decoración sustituya la invitación por la pantalla de error global.

El acceso de un sorteo archivado sigue dependiendo de las reglas existentes, antes de montar el saludo. No se añaden lecturas, escrituras, servicios externos ni cambios de reglas para esta función.

## Organización y reproducción de recursos

- `src/lib/santaGreeting.js`: selección de personajes, distribución de piezas y curva finita de movimiento.
- `src/components/secretSanta/SantaGreeting.jsx`: carga de un solo atlas, preferencias y controles de reproducción.
- `greetingScene.js`: dibujo del árbol, del reno y de las piezas del guardián.
- `SantaGreetingBoundary.jsx`: aislamiento de fallos de decoración.
- `src/santa-greeting.css`: adaptación visual, sin cambios en las hojas del juego.
- `scripts/build-santa-greetings.mjs`: empaquetado de las tres piezas originales en un atlas WebP transparente de 512 × 256 por personaje.

Ejecuta `npm run sprites:santa-greetings` para reproducir los doce atlas. Cada uno ocupa entre unos 30 y 38 KB; se solicita únicamente el del guardián elegido. `public/santa-greetings/manifest.json` guarda las coordenadas y los hashes del recurso original y del resultado. Los originales se verifican sin modificarse.

## Comprobación

Pasaron 127 pruebas generales y 50 de reglas, además de la compilación. Se conservaron las mejoras de actualización de la sesión terminadas en el chat «Corregir cambio de contraseña», incluidas sus tres pruebas. Las cuatro nuevas pruebas del saludo comprueban selección sin repetición inmediata, secuencia de decoración y saludo, final sin movimiento, integridad de las tres piezas y ausencia de recortes en las doce figuras.

Con datos ficticios se revisaron pausa, repetición, revelado y ocultación del mismo destinatario, recarga con personaje distinto y la misma pareja, modo oscuro, decoración quieta y móvil de 390 px sin desbordamiento horizontal. También se archivó y restauró el intercambio local, y se retiraron temporalmente sus imágenes animadas para confirmar que la tarjeta seguía permitiendo consultar la asignación. Se restauraron las doce imágenes después de esa prueba.

Las capturas de revisión están en `design/amigo-secreto/2026-11-26/`. El [registro de publicación](releases/santa-saludos-production-2026-11-26.json) identifica la versión de Hosting y los recursos publicados. No se modificaron sorteos ni cuentas reales para estas pruebas.
