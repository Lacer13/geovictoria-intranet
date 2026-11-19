# TecnoIA v2 · Verificación móvil y vista previa

19 de noviembre de 2026. [Abrir el juego en producción](https://geovictoria-intranet-peru.web.app/juego). Piloto cerrado; PR #1 integrado.

## Resultado y alcance

El usuario confirmó desde su teléfono «Sí, se ven y responden bien» al consultar si el disparo y los controles eran claros y respondían bien. Es aceptación de esos aspectos en un dispositivo real; no se proporcionaron modelo, sistema o navegador, ni se midieron FPS, consumo o temperatura. La revisión automática del navegador utilizó tamaños emulados.

Se corrigieron dos problemas: los controles quedaban debajo de la pantalla en horizontal y el marcador hacía saltar la pausa de línea a 320 px, desplazando los botones. Ahora la escena tiene controles laterales en horizontal; en vertical el marcador es compacto, se elimina el botón de poder duplicado y los controles pueden ajustarse al ancho. El texto «Puntos» conserva su nombre accesible. La recomendación de jugar en horizontal aparece en vertical.

## Matriz de revisión

| Entorno | Comprobación | Resultado |
| --- | --- | --- |
| 320×568, vertical, controles grandes | Ancho/alto del documento y posición de los botones | Documento 320×568 sin desbordamiento. Joystick y disparo de 92,8 px; poder de 64 px; todos dentro de la pantalla. |
| 568×320, horizontal, controles grandes | HUD, pausa y acciones disponibles sin desplazamiento | Documento 568×320 sin desbordamiento; pausa de 44 px de alto, joystick/disparo de 80 px y poder de al menos 48 px de alto. |
| 390×844, vertical | Inicio y partida | Revisión visual del selector y controles. |
| 844×390, horizontal | Escena completa y controles laterales | Revisión local y de la versión pública, sin aviso de recuperación de recursos. |
| Teléfono del usuario | Claridad del disparo y controles; respuesta | Aceptado por el usuario en el chat. |
| Pruebas y build | Simulación, sprites, carga y compilación | 77 pruebas correctas y compilación de producción correcta; lint del componente sin avisos. |
| Recursos publicados | Respuesta HTTP y huellas SHA-256 | HTML, CSS del juego, metadatos y ambas hojas devuelven 200 y coinciden con `dist`. |

Evidencia: [horizontal local](../design/characters/tecnoia/mobile-v2-horizontal.jpg), [vertical a 320 px](../design/characters/tecnoia/mobile-v2-320-grande.jpg), [partida en Firebase](../design/characters/tecnoia/preview-v2-publicado.jpg). No se enviaron resultados al ranking.

## Publicación temporal

Canal `tecnoia-v2` de `geovictoria-intranet-peru`; versión `0325211ebba82b78`. Vence el **26 de noviembre de 2026 a las 13:34, hora de Lima**. El [registro del despliegue](releases/tecnoia-v2-preview-2026-11-19.json) incluye URL, expiración y huellas públicas de los recursos. No contiene credenciales.

Para renovar la vista previa desde una sesión autorizada:

```sh
npm run deploy:preview:tecnoia
```

El comando ejecuta pruebas y build y publica solo ese canal durante siete días con Firebase CLI 15.34.1. `--no-authorized-domains` conserva los dominios de Authentication. La vista previa comparte el backend actual; no se desplegaron reglas Firestore ni Hosting de producción.

## Producción comprobada

Con autorización del usuario, el [PR #1](https://github.com/Lacer13/geovictoria-intranet/pull/1) se integró en main (`0df51c2fdacd2bf6dc9059586aa671d67d08aa9d`). GitHub Actions pasó las 77 pruebas, compilación y reglas Firestore. Se verificó que el árbol integrado coincide con el commit validado `15f479115ea5108ee90f7bc357332aa23f89f9a8`.

Se promovió la versión inmutable `0325211ebba82b78` del mismo sitio al canal `live`, sin recompilar otra variante. Publicada el **19 de noviembre de 2026 a las 13:44 (Lima)**. `/juego` y 19 recursos comprobados devuelven 200: HTML, entradas JS/CSS, módulo/estilos del juego, metadatos, dos hojas, fuente y miniatura. Sus SHA-256 coinciden con el build validado; se conservan los encabezados `nosniff` y `DENY`.

Revisión visual de producción a 844×390: inicio de partida, disparo asistido con proyectiles visibles y puntaje en partida, pausa, reanudación y regreso al selector. Controles laterales completos; sin errores ni advertencias en consola. No se envió el resultado al ranking. Se restableció disparo asistido y el tamaño normal del navegador.

La [captura de producción](../design/characters/tecnoia/produccion-v2-horizontal.jpg) y el [registro público de publicación](releases/tecnoia-v2-production-2026-11-19.json) documentan la entrega. La versión anterior `7d12e5ed6b74488a` y el comando de restauración están registrados allí. No se desplegaron reglas Firestore ni se cambiaron dominios de Authentication.

TecnoIA queda cerrado como piloto de animación. El siguiente paso del roadmap son las poses y la actuación propia de ConectIA, todavía sin implementar.
