# Escenarios con profundidad · 26 de noviembre de 2026

Tres fondos originales creados con ImageGen integrado para bosque, taller congelado y faro. Los PNG originales y los [prompts](prompts-v1.md) se conservan aquí; el selector usa miniaturas y la partida carga la versión WebP del escenario elegido. El aspecto es una ilustración 3D con una presentación 2D y capas suaves de profundidad.

Se reservó el centro para distinguir guardianes, rivales y proyectiles. La cámara y la nieve decorativa se detienen con movimiento reducido. Si falla la imagen, continúa el fondo dibujado de respaldo.

Reproducir con `npm run scenery:build`. El [manifiesto](manifest-v1.json) registra medidas y SHA-256. Las tres escenas suman 242.390 bytes; las miniaturas miden 480×270. No se midió rendimiento en teléfono físico.

La revisión `/design/scenery/revision.html` se sirve solo desde Vite. Con `VITE_USE_FIREBASE_EMULATORS=true` y `VITE_FIRESTORE_EMULATOR_PORT=8194` permite probar los componentes reales de publicación y tabla contra `firebase.scenery-demo.json`, proyecto `demo-geovictoria`. Sin el emulador no muestra la publicación de prueba. Esta página no se incluye en Hosting.

[Guía de uso](../../docs/escenarios-puntajes.md) · [Capturas y verificaciones](../../docs/qa-escenarios-puntajes-2026-11-26.md).
