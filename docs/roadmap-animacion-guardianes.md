# Roadmap de animación · Guardianes con gestos y disparos claros

18 de noviembre de 2026 · Actualizado el 19 de noviembre de 2026. **Estado: TecnoIA y ConectIA v2 cerrados, integrados en main y publicados en producción, con aceptación móvil del usuario. Siguiente personaje: CierreIA.**

## Objetivo

Que cada guardián actúe y se exprese al jugar: que se vea cómo apunta, desde dónde dispara, cómo reacciona y cómo usa su poder. La referencia es la claridad de VictorIA Clásico, conservando el estilo navideño y la identidad aprobada de los doce guardianes.

El trabajo se hará **de uno en uno**, empezando por TecnoIA. Se termina y comprueba un personaje antes de producir el siguiente. Producción utiliza TecnoIA y ConectIA v2. Los otros diez guardianes conservan v1.

**Avance del 19 de noviembre:** se preparó la copia local y una [primera lámina de ocho poses de TecnoIA v2](../design/characters/tecnoia/README-v2.md), con proyector en la mano libre y expresiones diferenciadas. Es un borrador para revisión: la limpieza de bordes, las secuencias completas, los anclajes y la integración siguen pendientes. Los recursos jugables v1 se conservan.

**Continuación del 19 de noviembre:** segundo borrador con expresión de combate más amable; ocho poses extraídas automáticamente y [plancha de revisión a 160/320 px](../design/characters/tecnoia/revision-v2-borrador-02/contacto.webp). El exportador comprueba rectángulos, transparencia en bordes y celdas vacías; el empaquetado admite cuadrículas variables, márgenes, separaciones y páginas. Esto completa una parte de la preparación técnica, no el soporte jugable v2. Persisten halos y píxeles sueltos que requieren otra corrección de arte.

**Segundo hito del 19 de noviembre:** se produjo una fuente separada de tres expresiones y seis manos/accesorios. El usuario autorizó limpiar localmente el alfa después de que ImageGen repitiera los residuos. La fuente opaca y el proceso reproducible se conservan. Se exportaron un disparo de 12 fotogramas y una celebración completa de estudio de 60 fotogramas a 24 FPS (2,5 s), con entrada, llave elevada, saludo articulado, remate y salida. La página de revisión permite reproducción, cámara lenta, tamaños 112/160/320 y movimiento reducido. Todavía no se sustituyen los recursos jugables.

**Tercer hito del 19 de noviembre:** TecnoIA v2 utiliza 203 sprites y fuente limpia dentro del selector, partida y resultados. La emisión tiene eventos por descarga aceptada, origen compartido, sonido deduplicado e interpolación de nacimiento; se conservan posiciones físicas, cadencias y poderes. Se revisaron combate, pausa/reanudación, derrota y reinicio en Chrome. La celebración completa está conectada a resultados. Los recursos del piloto y las capturas se versionan en GitHub; el despliegue de Firebase y las pruebas en teléfonos reales siguen pendientes.

## 1. Diagnóstico verificado

Se revisaron la hoja original de VictorIA Clásico, el atlas de TecnoIA y el código de animación, simulación y dibujo.

| Situación actual                                                                                                           | Efecto visible                                                                                | Mejora necesaria                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Clásico tiene una pose ilustrada de disparo, con mirada enfocada y emisor visible junto al auricular                       | Se entiende la acción, aunque tenga pocas poses                                               | Recuperar esa claridad con poses específicas para los guardianes                                             |
| Cada guardián parte de una cabeza, una mano con accesorio y una mano abierta                                               | La pose de presentación sigue dominando durante el combate                                    | Dibujar variantes de manos y expresiones apropiadas para cada acción                                         |
| El gesto de disparo de `sampleRig` rota y desplaza las mismas piezas                                                       | Hay movimiento, pero la mano no adopta una pose de disparo ni aparece un emisor               | Añadir apuntado, emisión, retroceso y recuperación con cambios de silueta                                    |
| El disparo normal nace de `p.x + p.width - 16`, `p.y + 60`                                                                 | El punto de salida no sigue la posición y orientación reales de una boquilla                  | Definir un punto de emisión vinculado a la pose del personaje                                                |
| El estado `shooting` se mantiene durante el disparo continuo; el animador no recibe un identificador por proyectil emitido | El bucle visual puede desalinearse con cada disparo, especialmente con Ráfaga                 | Sincronizar los gestos mediante eventos de disparo aceptados por la simulación                               |
| Las hojas actuales tienen 184 fotogramas por personaje, exportados mediante transformaciones de sus piezas                 | La cantidad de sprites no equivale a esa cantidad de poses ilustradas o expresiones distintas | Mejorar primero las poses y la puesta en escena; después decidir cuántos fotogramas necesita cada transición |

Los controles, la interpolación y las hojas actuales son una base reutilizable. Las comprobaciones de márgenes y contenido siguen siendo útiles, pero no demuestran por sí solas que una acción se entienda.

Referencias: [`Sprinn nuevo Victoria.png`](../public/Sprinn%20nuevo%20Victoria.png), [`rig.js`](../src/game/rig.js), [`simulation.js`](../src/game/simulation.js), [`animation.js`](../src/game/animation.js), [`render.js`](../src/game/render.js), [`ActiveBreak.jsx`](../src/components/ActiveBreak.jsx).

## 2. Dirección visual propuesta

### Formato de las hojas: cuadrícula flexible por secuencia

Se verificaron los archivos y metadatos de los doce guardianes. La estructura actual es:

| Recurso                          | Distribución                                 | Contenido real                                                                                                   |
| -------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Referencia VictorIA Clásico      | 2 columnas × 2 filas                         | Cuatro poses ilustradas diferentes                                                                               |
| Atlas de piezas de cada guardián | Composición 2×2, PNG de 1254 × 1254          | Cabeza completa, mano con accesorio, mano abierta y un espacio vacío; no es una secuencia de cuatro fotogramas   |
| Hoja de animación actual         | 24 columnas × 9 filas, WebP de 3840 × 1440   | 216 espacios de 160 × 160; se usan 184 fotogramas y los espacios restantes quedan libres                         |
| Celebración actual               | Dos filas de 24 fotogramas dentro de la hoja | 48 fotogramas reproducidos en un bucle de 1,4 segundos, aproximadamente 34,3 fotogramas de animación por segundo |

La frecuencia de una secuencia de animación es distinta de la frecuencia de dibujo del juego. Las dimensiones de la cuadrícula son una forma de empaquetar imágenes; cambiar de 2×2 a 4×4 no determina por sí solo la calidad.

**La cuadrícula de v2 será flexible, según la acción, su resolución y la cantidad de fotogramas.** El usuario autoriza hojas mayores, como 7×7, cuando resulten convenientes; 4×4 es una opción de revisión y no un límite. Cada bloque mostrará el personaje completo en poses consecutivas, numeradas y en el orden de reproducción. Se podrán usar varias hojas para una acción.

| Ejemplo de cuadrícula | Espacios disponibles | Uso posible, sin fijar todavía el formato final                              |
| --------------------- | -------------------- | ---------------------------------------------------------------------------- |
| 4×4                   | 16                   | Revisar una parte de la secuencia; tres bloques pueden mostrar 48 fotogramas |
| 7×7                   | 49                   | Alojar una secuencia de 48 fotogramas y dejar una celda libre                |
| 8×8                   | 64                   | Alojar, por ejemplo, una secuencia de 60 fotogramas                          |
| 8×9                   | 72                   | Alojar una secuencia de 72 fotogramas sin exigir una hoja cuadrada           |

La cuadrícula se elegirá después de fijar el gesto y su duración. Se priorizará conservar una resolución suficiente por fotograma: aumentar de 4×4 a 7×7 dentro de una imagen del mismo tamaño reduce el espacio de cada personaje. Una hoja fuente de 1254 × 1254 tampoco se divide exactamente en siete celdas enteras por lado. No se reinterpretará el atlas actual de cabeza/manos como una hoja 7×7 ni se inventarán fotogramas al cortar más celdas.

El atlas de distribución para el juego podrá agrupar esos mismos fotogramas de otra forma si mejora el tamaño y la carga. Los metadatos definirán su orden, duración y puntos de anclaje. El atlas de piezas seguirá separado de las hojas de secuencias completas.

### Separación automática y encuadre de los fotogramas

La separación será automática. No hace falta editar y guardar manualmente una imagen por fotograma para reproducir la animación. En el sistema actual, el exportador dibuja cada fotograma en su celda y escribe sus coordenadas; el juego utiliza un rectángulo de origen de la hoja para mostrarlo. Los archivos individuales podrán exportarse para revisión cuando sean útiles.

El código actual utiliza constantes de 24 columnas y celdas de 160 píxeles. **El soporte de cuadrículas variables para v2 todavía debe implementarse:** no basta con sustituir una imagen por otra 7×7. La entrega del piloto deberá:

1. Definir por hoja su tamaño, filas/columnas, tamaño de celda, márgenes, separación entre celdas y páginas si hay más de una imagen.
2. Calcular los rectángulos de cada fotograma y registrar solo las celdas que pertenecen a la secuencia; ignorar las sobrantes.
3. Conservar transparencia, centro de giro, escala y anclajes de mano/boquilla. Mantener margen para que el gorro, las antenas, los dedos y los accesorios no salgan de la celda durante el gesto.
4. Adaptar exportador, lector y render a los metadatos de cada personaje/hoja, conservando la compatibilidad con los guardianes v1 durante el avance individual.
5. Comprobar que todos los rectángulos estén dentro de la imagen y no se solapen; revisar que no haya contenido cortado, celdas vacías dentro del clip, saltos de escala o cambios de identidad.
6. Revisar la secuencia separada, una plancha de contacto y la reproducción real dentro del juego. Si una hoja generada no respeta una cuadrícula uniforme, corregir sus fuentes o usar rectángulos comprobados; no cortar a ciegas según el número de filas anunciado.

Por ejemplo, una hoja regular 7×7 con celdas de 160 × 160, sin margen ni separación, mediría 1120 × 1120. El fotograma 48 —índice 47 empezando por cero— estaría en la columna 5, fila 6, también empezando por cero. La última celda quedaría libre. Este ejemplo verifica la lógica de empaquetado; no fija la resolución ni crea una animación nueva.

**Disparo básico:** un proyector compacto de energía integrado en la **mano libre**, con boquilla circular reconocible. La mano deja de saludar, se orienta hacia la derecha del escenario y adopta una pose de apuntado. La otra mano conserva la llave, maletín, campana o accesorio de su área.

Esta es la propuesta para desarrollar con el piloto, todavía no un recurso producido. El proyector tendrá materiales y colores de cada guardián, manteniendo un funcionamiento común. No se convertirá automáticamente cada accesorio en un arma: por ejemplo, la llave de TecnoIA y el maletín de CierreIA conservarán su lectura original.

Reglas que continúan vigentes:

- Solo cabeza y dos manos flotantes, sin cuerpo, cuello, hombros ni brazos.
- Ninguna estrella en personajes, accesorios o efectos propios. Sin icono de rayo en el botón del poder.
- Cabeza, antenas, gorro, dedos y accesorios completos, con transparencia limpia.
- Conservar nombres, paletas y personalidad. Enterprise sigue siendo **CierreIA**, relacionado con ventas y grandes cuentas.
- Mantener los poderes existentes, sus recargas, daño, reglas de puntuación y tamaño de colisión durante esta mejora visual. Cualquier cambio de mecánica se tratará por separado.
- El arcade actual dispara hacia la derecha, también al desplazarse hacia la izquierda o verticalmente. Las poses de apuntado respetarán esa dirección.

## 3. Primera entrega · TecnoIA v2

### A. Poses clave antes de exportar sprites

Preparar una lámina de TecnoIA con variaciones coherentes de la misma identidad:

1. Reposo: manos relajadas y flotación suave.
2. Listo para disparar: mirada enfocada, mano libre orientada y proyector desplegado.
3. Emisión: boquilla visible, gesto decidido y destello breve.
4. Retroceso: reacción pequeña de la mano, dedos y cabeza.
5. Recuperación: regreso a la pose de apuntado al mantener el disparo, o al reposo al soltarlo.
6. Movimiento en combate: inclinación y desplazamiento de las manos sin perder la dirección de disparo.
7. Esquiva: pose recogida con un gesto propio, seguida de recuperación clara.
8. Impacto, celebración y descanso: expresiones y posiciones nuevas donde el rig actual no comunique suficientemente la acción.

El primer objetivo son poses legibles. Se reutilizarán curvas y piezas para unirlas, sin generar cada fotograma como una imagen independiente que pueda cambiar de rostro, dedos o proporciones.

### B. Secuencia de disparo

```mermaid
flowchart LR
  A[Listo para apuntar] --> B[Emisión sincronizada]
  B --> C[Retroceso]
  C --> D[Recuperación]
  D -->|Mantiene disparo| A
  D -->|Suelta disparo| E[Reposo]
```

La preparación visual debe ser breve. El destello, el sonido y el proyectil compartirán el instante de emisión. No se añadirá una espera decorativa que haga sentir lento el control: si la simulación acepta el disparo inmediatamente, la animación empezará en el fotograma adecuado de emisión y recuperará después la pose armada.

### C. Punto de salida y sincronización

- Añadir a los metadatos de cada pose el anclaje de la mano, la boquilla y su dirección; usar coordenadas locales y transformaciones compartidas.
- Calcular la salida en la simulación después del movimiento del paso correspondiente. El render utilizará ese mismo contrato de pose y anclaje, incluida la inclinación visual que afecte a la mano.
- Registrar un evento por disparo aceptado con identificador, paso de simulación, origen y tipo de disparo. El sonido y el efecto visual consumirán ese evento; dibujar un fotograma no creará proyectiles.
- Corregir los desfases de interpolación entre el actor y la emisión. No obtener la posición física del proyectil de un reloj de render variable.
- Sincronizar también disparo doble, abanico, disparo guiado, Reflejo y Gran cierre. Ráfaga deberá acompañar su cadencia más rápida sin limitarla con una animación más larga.
- Permitir que apuntado y retroceso se combinen con movimiento, impacto y poder mediante prioridades explícitas. Recibir daño o pausar no debe duplicar, perder ni dejar pendientes disparos.
- En efectos reducidos, conservar una pose de apuntado y una salida reconocibles aunque se suprima el balanceo o el destello intenso.

### D. Entrega comprobable del piloto

La entrega incluirá planchas secuenciales con la cuadrícula adecuada —4×4, 7×7 u otra— para revisar el ciclo de disparo y la celebración, además de sus hojas y metadatos jugables. Una plancha representa el personaje completo en cada celda; no se presentará un atlas de piezas como si fuera una secuencia animada. Se comprobará la separación automática antes de integrar el personaje.

TecnoIA v2 tendrá fuentes de las nuevas poses, hoja de sprites, metadatos de animación/anclajes, miniatura coherente y una muestra dentro del juego. La vista previa mostrará el ciclo completo con emisión visual, para que «Disparando» enseñe de dónde sale el proyectil. Esa demostración no guardará puntos ni modificará una partida.

Se probarán primero el disparo individual y continuo, después sus combinaciones con movimiento y esquiva. Solo se extenderá la plantilla cuando se cumplan los criterios de calidad de este documento.

### E. Celebración completa de TecnoIA v2

La celebración es una entrega obligatoria del piloto, con poses y expresiones específicas. Tendrá una secuencia con principio y final:

1. **Entrada:** pasa de la pose de combate a una expresión alegre, relaja el proyector y prepara el gesto.
2. **Gesto principal:** levanta su llave y acompaña la acción con mirada, cabeza y posición de dedos; conserva el accesorio y las proporciones.
3. **Saludo:** la mano libre adopta una pose real de saludo, con variaciones de dedos y palma, coordinada con una expresión de celebración.
4. **Remate:** una pausa breve y legible que permita reconocer la victoria.
5. **Salida:** baja suavemente las manos y vuelve a una pose tranquila mientras la pantalla de resultados permanece disponible.

**Objetivo inicial:** al menos 48 fotogramas con cambios visibles distribuidos entre esas fases. Se evaluará una secuencia de 48–72 fotogramas a 24 fotogramas de animación por segundo, aproximadamente 2–3 segundos; el piloto fijará los tiempos definitivos. Los fotogramas intermedios se producirán desde poses clave y transiciones coherentes. No basta con repetir o rotar una única mano ni con acelerar un bucle para aumentar la cifra de FPS.

Entrada y salida serán secuencias de una sola reproducción. Si se decide mantener una parte central en bucle, tendrá un enlace continuo y no repetirá toda la entrada. Los botones de resultados seguirán respondiendo durante la animación. En efectos reducidos se mostrará una pose de victoria reconocible sin exigir reproducir la secuencia completa.

La revisión se hará en velocidad normal, en cámara lenta para detectar saltos y al tamaño real dentro del juego. Se comprobarán el inicio, los cambios de gesto, la unión con el reposo, los dedos, el rostro y el encuadre. Se conservará una muestra sin audio para poder valorar el gesto por sí mismo.

**Condición de salida del piloto:** completar y verificar tanto el disparo como esta celebración antes de pasar a ConectIA. Después, cada guardián recibirá su propia secuencia completa siguiendo su personalidad y accesorio; no se copiará el mismo saludo a los doce.

## 4. Ciclo para cada personaje

| Paso                   | Entrega                                                                 | Condición para avanzar                                                 |
| ---------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Diseño de poses        | Lámina con apuntado, emisión, retroceso, poder y celebración            | La acción se entiende por la pose, incluso sin efectos                 |
| Arte consistente       | Manos y expresiones nuevas con la identidad existente                   | Sin dedos extra, partes incompletas ni cambios accidentales de rostro  |
| Animación              | Transiciones y tiempos ajustados a sus acciones                         | No parece una imagen inmóvil oscilando; entrada y salida no dan saltos |
| Integración            | Boquilla, evento de disparo, efectos y poder conectados                 | Cada proyectil nace del lugar correcto y acompaña su gesto             |
| Verificación           | Pruebas de reglas/anclajes y revisión visual en tamaños reales de juego | No cambia la cadencia, el daño ni la colisión; se lee en móvil         |
| Publicación individual | Fuentes, sprites, metadatos y código versionados en GitHub              | Se verifica lo publicado antes de iniciar el siguiente guardián        |

Las observaciones del usuario se incorporarán al personaje activo. **Límite de trabajo: un guardián en producción a la vez.** Una corrección de plantilla se comprueba en los personajes ya terminados; no se regeneran automáticamente los doce.

## 5. Orden propuesto, uno por uno

| Turno | Personaje                  | Foco específico después del disparo común                                           |
| ----- | -------------------------- | ----------------------------------------------------------------------------------- |
| 1     | TecnoIA · Operaciones y ST | Validar el proyector, la expresión de apuntado y la esquiva                         |
| 2     | ConectIA · Comercial       | Sincronizar la Ráfaga rápida sin perder retroceso ni claridad                       |
| 3     | CierreIA · Enterprise      | Diferenciar el disparo normal de Gran cierre; gesto comercial y maletín conservados |
| 4     | Prisma · Preventa          | Conectar la pose del cristal y el efecto de penetración                             |
| 5     | RadarIA · SDR              | Coordinar activación del radar, mirada y proyectiles guiados                        |
| 6     | FestivIA · Eventos         | Hacer visible el toque de campana que inicia la Campanada                           |
| 7     | ArmonIA · RRHH             | Gesto de Calma y expresión amable distintos del disparo normal                      |
| 8     | OrdenIA · Administración   | Colocación clara de la Barrera y recuperación de la mano                            |
| 9     | Balance · Cobranzas        | Gesto de Recuperación con ábaco y señal visual de la vida recuperada                |
| 10    | AlianIA · Partners         | Activación de Reflejo y devolución visible de los proyectiles                       |
| 11    | Norte · Country Manager    | Gesto de brújula y activación reconocible de Tiempo lento                           |
| 12    | ÁgilIA · SMB               | Activación del imán, atracción de mejoras y celebración alegre                      |

Los turnos 2 y 3 sirven para comprobar dos exigencias distintas de la plantilla: disparo muy rápido y disparo especial potente. El resto avanza individualmente con sus mismos criterios. Este orden es una propuesta; no implica producir las doce variantes a la vez.

## 6. Criterios de calidad

Un personaje se considera listo cuando:

- **Se reconoce el disparo:** cambia la pose de la mano y la expresión; el emisor se distingue al tamaño real de juego, no solo en una imagen ampliada.
- **Se ve su origen:** el centro del primer tramo del proyectil coincide con la boquilla. Se revisa al moverse, al disparar continuamente y al utilizar mejoras.
- **Hay reacción:** el retroceso y la recuperación son visibles sin hacer vibrar toda la cabeza ni bloquear los controles.
- **Cada disparo corresponde a un evento:** no se pierde sincronía al cambiar de FPS, pausar/reanudar o activar Ráfaga. El disparo doble y el abanico no generan varios retrocesos desordenados por una sola descarga.
- **El poder y la celebración tienen poses propias:** la celebración conserva su gesto distintivo y se mejora su actuación; añadir fotogramas idénticos o más balanceo no satisface este punto.
- **Todo el personaje está completo:** sin cortes, halos rectangulares, piezas que atraviesen el rostro, dedos adicionales, cuerpo o estrellas.
- **Se puede jugar con claridad:** efectos contenidos, sonido opcional y alternativa de movimiento reducido. Se comprueban tamaños de navegador de escritorio y móvil y después dispositivos reales del equipo.
- **Hay evidencia visual y funcional:** lámina de poses, secuencia de disparo sin audio, muestra jugable y comprobaciones de anclajes, tiempos y reglas.

Las pruebas automáticas de cantidad de frames, alfa y márgenes se conservarán. Se añadirán pruebas de sincronización, anclajes y persistencia de las reglas existentes. La valoración del gesto seguirá necesitando inspección visual.

## 7. Versionado, alcance y siguiente acción

Los recursos se publicarán como v2 junto a la v1 existente, con metadatos explícitos por personaje. El catálogo podrá mezclar guardianes v1 y v2 durante el avance. Si falla un recurso nuevo, la recuperación conservará una representación completa y un anclaje válido, sin dibujar un proyector invisible que emita desde otro lugar.

El piloto definirá la cantidad final de poses, fotogramas, cuadrícula, tamaño de celdas y presupuesto de carga, partiendo del objetivo de celebración completa de la sección 3.E. No hay un máximo de 4×4 o 7×7; se usarán hojas mayores o varias páginas si la secuencia lo necesita y conserva la definición y el rendimiento. Se medirá el peso de las variantes y su legibilidad antes de repetirlas. No se prometen plazos para los doce personajes sin conocer ese resultado.

**Siguiente acción:** preparar las poses propias de **CierreIA**, conservando su maletín y personalidad de Enterprise. Diferenciar el disparo normal de Gran cierre y mantener sus reglas de daño/cadencia. Reutilizar eventos, anclajes y recuperación de los dos personajes terminados, con celebración propia completa. TecnoIA y ConectIA están comprobados en [producción](https://geovictoria-intranet-peru.web.app/juego); las aceptaciones móviles no se extienden automáticamente al siguiente personaje. Historia y multijugador continúan en el [roadmap general](roadmap-videojuego.md).

## 8. Primer hito · Poses y extracción (registro histórico)

| Entrega | Estado comprobado el 19 de noviembre | Evidencia / pendiente |
| --- | --- | --- |
| Poses clave | Segundo borrador, en revisión | Ocho acciones; gesto de combate suavizado. Contornos, dedos y orientación de boquilla todavía no aprobados. |
| Extracción automática | Implementada para revisión | `npm run poses:tecnoia`; ocho PNG transparentes de 320×320 y página de 1280×640, sin retocar el alfa original. |
| Cuadrículas variables | Geometría y exportador implementados | Comprobados 48 fotogramas en 7×7, 72 en 8×9 y varias páginas con márgenes/separación. Son pruebas geométricas, no arte nuevo de esas secuencias. |
| Revisión de tamaño | Plancha inspeccionada | Cada pose aparece a 160 y 320 px, sobre fondos oscuro y claro. Persisten halos; las comprobaciones geométricas no los aprueban. |
| Disparo y celebración completos | Pendientes | Faltan poses intermedias, tiempos, celebración de entrada a salida y aprobación visual. |
| Anclajes, eventos, lector y render v2 | Pendientes | El exportador actual de v1, la selección de sprites y las reglas del juego no se modifican en esta entrega. |
| Comprobaciones | 63 pruebas y compilación correctas | Se incluyen seis pruebas nuevas de geometría, exportación, alfa y recursos de TecnoIA. Las reglas Firestore se mantienen sin cambios; requieren el emulador para su verificación separada. |

Los metadatos de revisión declaran `kind: key-poses` y `productionReady: false`. Ninguna de estas ocho poses se presenta como una celebración animada completa. Fuentes, prompts, manifiesto y resultados reproducibles se conservan junto a los borradores anteriores y se sincronizan en GitHub.

## 9. Segundo hito · Fuente limpia y secuencias de estudio (registro histórico)

| Entrega | Estado | Evidencia |
| --- | --- | --- |
| Fuente separada | Producida y revisada visualmente | [Atlas limpio](../design/characters/tecnoia/rig-v2-alpha-local.png): tres expresiones, llave, dos poses de proyector, dos manos de saludo y una de descanso. |
| Limpieza de alfa | Implementada y reproducible, autorizada por el usuario | Relleno desde bordes sobre el fondo gris medido; conserva RGB, blancos interiores y articulaciones oscuras. Se conserva la fuente opaca, parámetros y SHA-256. |
| Disparo | Secuencia de estudio exportada | 12 fotogramas a 60 FPS, 0,2 s. Emisión inmediata, retroceso y recuperación; boquilla horizontal, medida y comprobada en los sprites. |
| Celebración | Secuencia completa de estudio exportada | 60 fotogramas a 24 FPS, 2,5 s; varias expresiones y formas de mano, entrada, gesto, saludo, remate y salida. Una reproducción; mantiene reposo al terminar. |
| Hojas variables y lector | Implementados para la revisión | Dos páginas por clips, con nombres ordenados, rectángulos, anclajes de mano/boquilla y pivote. El lector no presupone 24 columnas ni 160 px. |
| Evidencia visual | Revisada en Chrome local | Reproducción y final de ambos clips, cámara lenta de disparo, fondos claro/oscuro, tamaños 112/160/320 y pose de victoria con movimiento reducido. GIF y planchas sin audio incluidos. |
| Comprobaciones | 69 pruebas y compilación correctas | Seis pruebas nuevas verifican limpieza de alfa, procedencia, márgenes, temporización, poses terminales, lectura por páginas y coincidencia de boquilla con píxeles cian. |
| Integración y estados restantes | Pendientes | Eventos físicos, sonido, interpolación, movimiento, esquiva, daño, poder y recuperación ante fallos. El arcade conserva v1. |

Reproducir: `npm run sprites:tecnoia-v2`. Abrir con Vite `design/characters/tecnoia/revision-v2.html`. Los [metadatos](../design/characters/tecnoia/revision-v2-secuencias-01/secuencias.json) declaran `kind: animation-study` y `productionReady: false`: las secuencias existen, pero no certifican aún una integración jugable terminada. Los GIF tienen temporización de centésimas compensada para conservar la duración total; las hojas y el lector utilizan los FPS originales.

## 10. Tercer hito · Integración jugable de TecnoIA v2

| Entrega | Estado comprobado | Evidencia |
| --- | --- | --- |
| Catálogo, carga y dibujo | Integrados | 203 sprites de 192×192 en dos páginas, nueve clips, miniatura nueva, fuente limpia y anclajes. Se solicita solo el personaje elegido. |
| Eventos y sonido | Integrados | Identificador, paso, origen y proyectiles por descarga; sonido una sola vez. Disparo doble/abanico conservan una reacción; cierre y reflejo también se registran. |
| Boquilla e interpolación | Comprobadas | El pivote alinea el arte con el centro físico original. Los recién nacidos parten de la boquilla interpolada, también al moverse o esquivar. No se modifican las reglas. |
| Composición y efectos reducidos | Integrados | Cabeza/llave reaccionan a movimiento, daño y esquiva mientras la mano dispara; orientación siempre a la derecha. Reloj visual monótono al pausar/reanudar. |
| Recuperación | Comprobada | Piezas v2 si falla una hoja; atlas si falla la fuente; v1 completo si no queda arte v2 utilizable. Proyector de respaldo visible incluso sin bitmaps, aviso y reintento. |
| Celebración y resultados | Conectados | 60 fotogramas, 24 FPS, 2,5 s, una reproducción y reposo final. Los controles de resultados permanecen disponibles. |
| Verificación | 77 pruebas y compilación correctas | Incluye partida completa de simulación v2 hasta victoria, carga con fallos y lectura/dibujo de todas las celdas. Chrome local: disparo manual/asistido, movimiento, esquiva, pausa, efectos reducidos, derrota y reinicio; sin errores de consola. |
| Peso y evidencia | Registrados | Aproximadamente 3,26 MB del conjunto v2. [Combate](../design/characters/tecnoia/integracion-v2-combate.jpg) y [resultados](../design/characters/tecnoia/integracion-v2-juego.jpg). |

El piloto se reproduce con `npm run sprites:tecnoia-game` y se abre en `/juego` con Vite. El estado posterior de verificación y publicación se registra en el cuarto hito.

## 11. Cuarto hito · Móvil y vista previa publicada

| Entrega | Estado comprobado el 19 de noviembre | Evidencia |
| --- | --- | --- |
| Distribución móvil | Corregida | En horizontal, escena central y controles laterales dentro de la pantalla; en vertical estrecho, marcador compacto y botones sin desbordamiento. Se conserva el nombre accesible «Puntos». |
| Pantallas pequeñas | Revisadas por emulación | 320×568 con controles grandes y 568×320 en horizontal sin desplazamiento; revisión visual adicional a 390×844 y 844×390. [Capturas y matriz](qa-tecnoia-v2.md). |
| Teléfono real | Aceptación del usuario | Confirmó «Sí, se ven y responden bien» al consultar claridad del disparo, visibilidad y respuesta de los controles. Modelo y navegador no informados. |
| Firebase Hosting | Vista previa publicada y comprobada | [Jugar TecnoIA v2](https://geovictoria-intranet-peru--tecnoia-v2-o55x61si.web.app/juego), canal `tecnoia-v2`, vence el 26 de noviembre de 2026 a las 13:34 (Lima). HTML, CSS del juego, metadatos y ambas hojas coinciden por SHA-256 con la compilación. |
| Reproducción y trazabilidad | Registradas | `npm run deploy:preview:tecnoia`, [registro público del despliegue](releases/tecnoia-v2-preview-2026-11-19.json) y capturas versionadas. |
| Producción y siguiente guardián | Resueltos en el quinto hito | El registro posterior documenta integración, promoción y comprobación de producción. ConectIA queda como siguiente personaje. |

La vista previa utiliza el mismo backend que la aplicación y es temporal. Durante la verificación no se enviaron puntos al ranking. No se cambiaron reglas Firestore ni dominios autorizados de Authentication; producción no se desplegó en este hito.

## 12. Quinto hito · Producción y cierre de TecnoIA

El usuario autorizó integrar y publicar la versión validada. El [PR #1](https://github.com/Lacer13/geovictoria-intranet/pull/1) se integró en `main` con commit `0df51c2fdacd2bf6dc9059586aa671d67d08aa9d`, después de pasar las 77 pruebas, build y reglas Firestore en GitHub Actions. El árbol integrado coincide exactamente con el de la vista previa aceptada.

Se promovió por su ID inmutable la versión de Hosting `0325211ebba82b78` a [producción · /juego](https://geovictoria-intranet-peru.web.app/juego), el 19 de noviembre de 2026 a las 13:44 (Lima). No se recompiló otra variante para publicar. La ruta, los recursos de entrada, el módulo del juego, sus estilos y todos los recursos de TecnoIA v2 responden correctamente y coinciden por SHA-256 con el build validado.

La revisión de producción comprobó inicio de partida, disparo asistido, pausa/reanudación y controles visibles a 844×390; sin errores ni advertencias de consola. Se terminó la partida sin enviar puntos al ranking y se restableció el ajuste de disparo asistido. [Captura](../design/characters/tecnoia/produccion-v2-horizontal.jpg), [QA](qa-tecnoia-v2.md) y [registro de publicación/restauración](releases/tecnoia-v2-production-2026-11-19.json).

**TecnoIA queda cerrado como piloto de animación v2.** El siguiente turno es ConectIA; su nuevo arte y sus secuencias todavía no se han producido. La versión anterior de Hosting está registrada para restauración. No se desplegaron reglas Firestore ni se cambiaron dominios de Authentication.

## 13. ConectIA · Primer hito de actuación

| Entrega | Estado del 19 de noviembre | Evidencia |
| --- | --- | --- |
| Fuente propia | Producida y revisada | Tres expresiones y seis manos/accesorios: baliza conservada, proyector horizontal, retroceso, mano abierta, pulgar arriba y descanso. [Fuente y prompts](../design/characters/conectia/README-v2.md). |
| Alfa | Limpieza local reproducible | Fuente opaca conservada; relleno del fondo medido desde bordes y semilla del hueco de la baliza. RGB, dedos blancos, juntas oscuras y emblema preservados. |
| Normal y Ráfaga | Secuencias de estudio completas | 12 y 6 fotogramas a 60 FPS: 0,2 y 0,1 s; emisión, retroceso y recuperación. Sus intervalos se contrastan con los eventos reales de la simulación, incluido el regreso a normal al acabar el poder. |
| Celebración propia | Secuencia de estudio completa | 72 fotogramas a 24 FPS, 3 s: entrada, doble vitoreo con baliza, pulgar arriba, remate y salida a reposo. No copia el saludo de TecnoIA. |
| Revisión | Comprobada en navegador local | [Página interactiva](../design/characters/conectia/revision-v2.html), [poses](../design/characters/conectia/revision-v2-secuencias-01/poses-contacto.webp), [cadencias](../design/characters/conectia/revision-v2-cadencias.jpg); fondos claro/oscuro, 112/160/320 px, cámara lenta, movimiento reducido y finales sostenidos. Sin errores ni advertencias de consola. |
| Verificación técnica | 82 pruebas y build correctos | Cinco pruebas nuevas de fuente/alfa, contrato de cadencia, celebración y las 90 celdas/anclajes; lint nuevo sin avisos. |
| Juego y publicación | Pendientes | ConectIA del arcade conserva v1. Faltan estados restantes, eventos/sonido/interpolación, recuperación, partida completa, móvil real y publicación individual. CierreIA espera. |

Los metadatos declaran `kind: animation-study` y `productionReady: false`. El estudio no guarda puntos y no se desplegó sobre producción. Las fuentes, prompts, scripts, hojas, GIF y capturas quedan versionados en la rama de ConectIA.

## 14. ConectIA · Integración jugable y vista previa

| Entrega | Estado del 19 de noviembre | Evidencia |
| --- | --- | --- |
| Catálogo y recursos | Integrados | 221 sprites de 192 px, diez clips, dos páginas, fuente limpia y miniatura. [Guía jugable](../design/characters/conectia/README-v2.md), comando `npm run sprites:conectia-game`. |
| Normal y Ráfaga | Sincronizados | Cada descarga conserva su intervalo aceptado de 12/6 pasos; activar o terminar el poder no estira ni repite la reacción anterior. Sonido una vez por evento. |
| Movimiento, daño y poder | Compuestos | Cabeza/baliza reaccionan mientras la mano dispara a la derecha. Boquilla e interpolación coinciden con el origen físico anterior; reglas conservadas. |
| Selección y resultados | Conectados | Demostración de Ráfaga, celebración de 72 fotogramas a 24 FPS, una reproducción de 3 segundos y reposo sostenido. |
| Carga y respaldo | Comprobados | Solo el guardián elegido; piezas v2, atlas o v1 según el fallo, conservando un proyector visible y reintento. |
| Verificación técnica | 91 pruebas y build correctos | Nueve pruebas nuevas; incluye partida con Ráfaga hasta victoria, comparada con v1 en resultado/puntaje/pasos/vidas. Se conservan las pruebas de TecnoIA. |
| Firebase | Vista previa publicada | [Canal ConectIA](https://geovictoria-intranet-peru--conectia-v2-97yuioz1.web.app/juego), vence el 26 de noviembre a las 17:20 (Lima). [Registro y huellas](releases/conectia-v2-preview-2026-11-19.json). |
| Aceptación móvil | Confirmada por el usuario | «Sí, se ve y responde bien» sobre disparo durante Ráfaga y controles. Modelo/navegador no informados; sin medición de FPS. |
| Cierre | Pendiente | Revisión e integración del PR y publicación de producción antes de CierreIA. |

## 15. ConectIA · Publicación y cierre

El usuario aceptó claridad de Ráfaga y respuesta de controles en su teléfono. El [PR #2](https://github.com/Lacer13/geovictoria-intranet/pull/2) se integró en main (`ebdd88b0f6b317c6ab96974ab05388b63ac6d092`) después de pasar 91 pruebas, compilación y reglas Firestore; el árbol integrado coincide con la versión validada.

Se promovió por ID inmutable la versión `9f49c47de6d060b4` a [producción](https://geovictoria-intranet-peru.web.app/juego), el 19 de noviembre de 2026 a las 17:30 (Lima). `/juego` y 19 recursos comprobados responden 200 y coinciden por SHA-256 con el build. La revisión de producción verificó selección, partida, disparo asistido, Ráfaga, pausa/reanudación y salida; sin errores ni advertencias de consola y sin enviar puntos al ranking.

[Captura](../design/characters/conectia/produccion-v2-rafaga.jpg) y [registro con versión anterior y restauración](releases/conectia-v2-production-2026-11-19.json). No se desplegaron reglas Firestore ni se cambiaron dominios de Authentication. **ConectIA queda cerrado; sigue CierreIA.**
