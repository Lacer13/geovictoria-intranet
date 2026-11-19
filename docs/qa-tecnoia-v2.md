# TecnoIA v2 · Verificación móvil y vista previa

19 de noviembre de 2026. [Abrir el juego](https://geovictoria-intranet-peru--tecnoia-v2-o55x61si.web.app/juego).

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

Siguiente paso del roadmap: revisar e integrar el PR, publicar la versión validada en producción y comprobarla antes de iniciar ConectIA. La aceptación móvil queda registrada; la publicación de producción sigue pendiente.
