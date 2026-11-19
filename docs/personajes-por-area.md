# Elenco por categoría · VictorIA: Operación Estrella

## Alcance confirmado

El usuario eligió **un personaje por cada categoría del directorio**: Administración, Cobranzas, Comercial, Country Manager, Enterprise, Eventos, Operaciones y ST, Partners, Preventa, RRHH, SDR y SMB. Las categorías se toman del directorio publicado, sin definir un organigrama nuevo.

Los **doce personajes del arcade individual** ya tienen su arte, hojas de sprites, miniaturas, poder y celebración propios. Por petición del usuario, se adelantó el elenco completo y las habilidades respecto al orden inicial del roadmap. VictorIA Clásica y VictorIA ST permanecen en la colección Clásicos, con sus desbloqueos locales.

La [guía de guardianes](guardianes-navidad.md) documenta poderes, recargas, recursos y animaciones. El [índice del arte](../design/characters/README.md) enlaza los atlas originales, hojas de sprites y prompts.

## Identidad visual

Todos comparten el universo de VictorIA: **cabeza y exactamente dos manos flotantes, sin torso, cuello ni brazos**, con dedos, antenas, gorro y accesorios completos. El estilo combina rostro blanco, ojos cian expresivos, materiales pulidos y gorro rojo con blanco. Las áreas se distinguen mediante emblema, accesorio, paleta y gesto, además de su nombre.

**Reglas confirmadas:** ningún personaje llevará estrellas en su diseño, accesorios ni efectos propios. El botón de poder muestra texto y recarga, sin icono de rayo. Enterprise adopta una identidad de ventas a grandes cuentas, con maletín y emblema de crecimiento.

| Categoría        | Personaje | Identidad                                 | Poder del arcade |
| ---------------- | --------- | ----------------------------------------- | ---------------- |
| Administración   | OrdenIA   | Cuadrícula dorada y portapapeles          | Barrera          |
| Cobranzas        | Balance   | Anillos, cobre y ábaco                    | Recuperación     |
| Comercial        | ConectIA  | Coral y comunicador de enlace             | Ráfaga           |
| Country Manager  | Norte     | Azul noche, globo y brújula de una aguja  | Tiempo lento     |
| Enterprise       | CierreIA  | Azul noche, esmeralda y maletín de ventas | Gran cierre      |
| Eventos          | FestivIA  | Rojo, verde y campana con cinta           | Campanada        |
| Operaciones y ST | TecnoIA   | Casco azul, engranaje y llave             | Esquiva          |
| Partners         | AlianIA   | Turquesa y anillos enlazados              | Reflejo          |
| Preventa         | Prisma    | Cristal triangular y tonos aqua           | Prisma           |
| RRHH             | ArmonIA   | Lavanda y corazón                         | Calma            |
| SDR              | RadarIA   | Verde lima y radar circular               | Radar            |
| SMB              | ÁgilIA    | Naranja y un imán                         | Imán             |

Los personajes son ficticios y representan aportes positivos de las áreas. Cualquier persona puede elegir cualquier guardián; no se condiciona la elección a su área real ni se valora con ello a sus colaboradores.

## Producción y animación

TecnoIA fue el piloto para la plantilla compartida. A partir de esa referencia se produjeron los once diseños adicionales con ImageGen integrado y se revisó la transparencia donde fue necesario. Los PNG finales permanecen como fuentes; el exportador no los retoca.

Canvas compone las piezas con centros de giro, curvas de flotación, inclinación, reacción y gestos. El exportador genera **184 fotogramas por personaje**: reposo, movimiento, disparo, esquiva, daño, activación del poder, celebración y descanso/derrota. Cada celebración tiene **48 fotogramas** y un gesto distinto. El conjunto suma **2.208 sprites**, con coordenadas, tiempos y metadatos versionados.

El juego carga los recursos del personaje elegido y usa la hoja de sprites durante la partida. La vista previa emplea el rig en mayor resolución. La interpolación de posiciones es visual; las colisiones, recargas y puntuaciones siguen resolviéndose con la simulación fija de 60 pasos por segundo.

Las verificaciones comprueban contenido, márgenes y variación entre fotogramas, el checksum del arte original, la selección y la ejecución de los doce poderes. Las manos y los accesorios no modifican el tamaño de colisión común. La prueba visual en navegador no sustituye el piloto con teléfonos y computadoras reales del equipo.

## Qué queda para la arena

El arcade conserva su carácter casual y el ranking del cliente. Antes de habilitar poderes en una competición se deberán validar su utilidad, duración, alcance, recarga y equilibrio mediante el servidor de partidas. Las habilidades del arcade no se declaran equilibradas entre sí para una futura arena.

La cámara cenital puede requerir perspectivas y animaciones adicionales. Primero se probará un prototipo de movimiento y visibilidad de rostro/manos, después la lectura de equipos, impactos y habilidades. Los colores de equipo tendrán una capa independiente del diseño de cada área y también se usarán nombres y emblemas.

Doce personajes disponibles no significa doce jugadores simultáneos: el objetivo multijugador sigue siendo diez, hasta 5 vs 5. Misiones, servidor, salas, reconexión, espectador y resultados verificados continúan en el [roadmap](roadmap-videojuego.md).
