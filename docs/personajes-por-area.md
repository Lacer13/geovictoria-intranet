# Elenco por categoría · VictorIA: Operación Estrella

## Alcance confirmado

El usuario eligió **un personaje por cada categoría del directorio**. La consulta del directorio publicado el 18 de noviembre de 2026 devuelve doce categorías: Administración, Cobranzas, Comercial, Country Manager, Enterprise, Eventos, Operaciones y ST, Partners, Preventa, RRHH, SDR y SMB.

El objetivo del elenco es **12 personajes jugables**. Las categorías se toman tal como aparecen en el directorio; no se está definiendo un organigrama nuevo. VictorIA Clásica sigue siendo la referencia visual y puede actuar como guía de la historia. La variante de Soporte Técnico existente es un punto de partida para Operaciones y ST, aunque sus recursos deberán adaptarse a la cámara y al sistema de animación elegidos.

Este documento define propuestas de diseño. Todavía no se han producido doce imágenes finales ni sus animaciones. Los nombres, accesorios y habilidades de la siguiente tabla son provisionales.

## Propuesta inicial de personajes

Todos comparten el universo visual de VictorIA: **cabeza y dos manos flotantes, sin torso, cuello ni brazos**, con proporciones y expresiones coherentes. Cada uno tendrá emblema, combinación secundaria de colores, accesorio y efecto reconocibles. Los colores de equipo tendrán una capa de identificación independiente.

**Regla visual confirmada por el usuario:** ningún personaje llevará estrellas en su diseño, accesorios, emblemas, herramientas ni efectos propios. Se aplicará a las doce categorías y a sus variantes futuras.

| Categoría        | Nombre provisional | Identidad visual propuesta                                     | Idea de habilidad para evaluar después                                    |
| ---------------- | ------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Administración   | OrdenIA            | Emblema de engranaje y accesorios de organización dorados      | Colocar una baliza que ayude a proteger un objetivo                       |
| Cobranzas        | Balance            | Emblema de anillos y detalles cobre                            | Recuperar parte de la energía dispersa cerca de su equipo                 |
| Comercial        | ConectIA           | Emblema de enlace y visor coral                                | Dar un impulso corto de desplazamiento a aliados próximos                 |
| Country Manager  | Norte              | Emblema de brújula y detalles azul noche/dorado                | Marcar una zona de reunión con protección breve                           |
| Enterprise       | Bastión            | Visor robusto y emblema hexagonal                              | Proyectar una barrera temporal de alcance limitado                        |
| Eventos          | FestivIA           | Campanillas, luces y cintas festivas                           | Crear una zona breve que potencie la recuperación de una habilidad aliada |
| Operaciones y ST | TecnoIA            | Evolución de la variante ST, visor azul y herramienta flotante | Reparar un escudo o dispositivo aliado dentro del juego                   |
| Partners         | AlianIA            | Emblema de dos eslabones y detalles turquesa                   | Compartir una protección temporal con un aliado cercano                   |
| Preventa         | Prisma             | Visor prismático y emblema de cristal                          | Mostrar trayectorias u objetivos durante unos instantes                   |
| RRHH             | ArmonIA            | Emblema de ondas y detalles lavanda                            | Recuperar una cantidad limitada de energía aliada                         |
| SDR              | RadarIA            | Antenas y emblema de radar, detalles lima                      | Emitir un pulso de detección de alcance y duración limitados              |
| SMB              | ÁgilIA             | Visor ligero y emblema de rayo, detalles naranja               | Disponer de una esquiva alternativa con una compensación en su recarga    |

Las propuestas representan aportes positivos de cada categoría, sin convertir al personaje en una valoración de sus colaboradores. Son personajes ficticios; se diseñan como miembros del mismo equipo que colabora para recuperar la Estrella de Navidad.

## Primer piloto visual

Ya se preparó un [concepto de TecnoIA, de Operaciones y ST](../design/characters/tecnoia/README.md), con casco azul, engranaje, manos flotantes y una llave de reparación sin estrella. Es la primera referencia visual del elenco; la preparación de piezas y animaciones forma parte de la siguiente entrega.

## Identidad visual y habilidades son dos entregas distintas

**Primero:** doce identidades visuales sobre un kit común de movimiento, disparo y esquiva. Esto permite reconocer las áreas y probar el juego sin introducir doce sistemas de combate simultáneos.

**Después:** probar habilidades especiales agrupadas en roles, por ejemplo exploración, protección y apoyo. Se medirán utilidad, duración, alcance y recarga antes de habilitarlas en competición. Las habilidades de la tabla son candidatas, no ventajas ya aprobadas.

En el primer 1 vs 1 se recomienda el kit común para todas las apariencias. La prueba de roles comienza en la etapa de equipos. La propuesta es permitir elegir cualquier personaje, independientemente del área real de quien juega. El objetivo de doce personajes no cambia el límite de diez jugadores en una partida 5 vs 5.

## Cómo producir cada personaje

1. **Ficha de identidad.** Categoría, nombre, personalidad, emblema, paleta y función dentro de la historia. Se revisa el conjunto para que se distingan entre sí.
2. **Diseño de referencia.** Imagen del personaje completo, cabeza y manos incluidas, con expresiones y accesorio principal. Se aprueba antes de producir el resto de sus recursos.
3. **Diseño para la cámara.** El arcade lateral y la arena vista desde arriba pueden necesitar representaciones distintas. Para la arena se probará una vista 2D estilizada de tres cuartos que mantenga visibles el rostro y las manos. La perspectiva se decide con el primer personaje de prueba.
4. **Preparación para animar.** Fondo transparente real y piezas completas: cabeza, manos, ojos/expresiones y accesorios cuando corresponda. Misma escala, centro de giro y margen entre piezas; ningún dedo, antena o borde de la cabeza puede quedar fuera del recurso.
5. **Animación.** Combinar movimientos programados de las piezas con secuencias de imágenes para expresiones o efectos que lo necesiten. Es posible reutilizar la estructura y los movimientos básicos entre personajes; no hace falta dibujar a mano cada fotograma de cada uno.
6. **Exportación.** Atlas o hoja de sprites, metadatos de sus piezas/fotogramas y configuración del personaje. Un atlas agrupa recursos que el juego carga y anima; una imagen de presentación por sí sola no completa este paso.
7. **Integración jugable.** Conectar los estados de animación con los controles, las colisiones, el HUD, las habilidades y los efectos.
8. **Verificación.** Revisar las transiciones, el encuadre completo, la lectura en tamaño pequeño, el rendimiento móvil y la identificación de aliados/rivales. Si tiene habilidad propia, probar también su equilibrio en el servidor de partidas.

### Animaciones base previstas

| Estado             | Qué debe verse                                              |
| ------------------ | ----------------------------------------------------------- |
| Reposo             | Flotación suave y expresión tranquila                       |
| Movimiento         | Desplazamiento e inclinación coherentes con la dirección    |
| Disparo            | Movimiento de mano y efecto de disparo sincronizados        |
| Esquiva            | Desplazamiento breve claramente reconocible                 |
| Daño               | Reacción corta y señal de protección posterior al impacto   |
| Habilidad especial | Gesto y efecto que permitan identificar qué está ocurriendo |
| Victoria           | Celebración breve propia del personaje                      |
| Derrota            | Reacción breve, legible y coherente con el estilo amistoso  |

La animación de habilidad se incorporará cuando esa habilidad exista; el resto se prepara sobre la base compartida. La cantidad de fotogramas y direcciones se decide con el prototipo, en vez de multiplicar de antemano doce personajes por un número arbitrario de imágenes. Las manos y los efectos pueden orientarse por programación cuando el diseño lo permita.

## Sistema compartido de arte y animación

- Una plantilla de proporciones, tamaño de cabeza y manos, iluminación y materiales.
- Una estructura de piezas y centros de giro compartida para flotación, inclinación y gestos.
- Expresiones y efectos propios cuando sean necesarios para la identidad.
- Variantes navideñas mediante accesorios intercambiables, útiles para futuras temporadas.
- Colisión y reglas de movimiento del kit común independientes de la forma del sombrero o de otros adornos.
- Emblemas y marcadores de equipo visibles, además del color, para distinguir personajes similares.
- Un catálogo de personajes basado en datos para añadir recursos, miniaturas y animaciones sin copiar toda la lógica del juego.

Compartir una estructura reduce trabajo y favorece la coherencia. Cada personaje seguirá necesitando revisión individual: una imagen nueva no garantiza que sus piezas y movimientos funcionen correctamente al integrarla.

## Distribución dentro del roadmap

| Etapa                  | Entrega del elenco                                               | Criterio de salida                                                                   |
| ---------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 0. Diseño              | Las doce fichas y una plantilla visual                           | Categorías, conceptos y perspectiva definidos para producir un primer personaje      |
| 1. Arcade mejorado     | Un personaje piloto terminado, con la variante ST como candidata | Cabeza/manos completas y movimientos básicos que funcionen en escritorio y móvil     |
| 2. Mini historia       | Tres personajes completos y un selector comprensible             | La estructura compartida funciona con tres diseños distintos                         |
| 3. Arena 1 vs 1        | Los personajes del piloto adaptados a la cámara y al kit común   | Se distinguen dirección, impactos y equipos sin diferencias accidentales de colisión |
| 4. Equipos pequeños    | Ampliación progresiva a seis u ocho personajes y prueba de roles | Habilidades útiles y legibles, probadas antes de habilitarse en competición          |
| 5. Piloto hasta 5 vs 5 | Las doce categorías representadas en el selector                 | Elenco integrado, rendimiento probado con diez jugadores y selección coherente       |

**Orden de producción recomendado:** terminar uno; comprobar la reutilización con otros dos; después producir los restantes por tandas. Operaciones y ST, Comercial y RRHH son candidatos para esa primera tanda por sus identidades distintas. El alcance final sigue siendo las doce categorías elegidas.
