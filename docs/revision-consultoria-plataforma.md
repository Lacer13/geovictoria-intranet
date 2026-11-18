# Revisión de la plataforma · GeoVictoria Perú

Fecha: 18 de noviembre de 2026. Versión revisada: `5fc36ff694306421067ec6e61a47387953220f40`.

## Dictamen

La plataforma tiene una base visual consistente, navegación móvil, búsqueda y controles útiles de accesibilidad. La simplificación reciente mejoró la lectura. La siguiente inversión debería concentrarse en resolver tareas cotidianas, mantener información oficial y cerrar el ciclo de atención de las solicitudes.

La Navidad y VictorIA aportan identidad. Conviene conservarlas y dar a los recursos de trabajo una utilidad equivalente: contactos actualizados, procedimientos concretos, responsables y respuestas verificables.

## Alcance y límites

Se recorrieron las pantallas públicas de inicio, directorio, equipo, conocimiento, solicitudes, Navidad, Amigo secreto y pausa activa. Se comprobó la búsqueda de vacaciones y la navegación móvil de 390 px; en la pantalla de solicitudes y en la entrada del juego no se observó desbordamiento horizontal. Administración, autenticación, correo y permisos se revisaron en el código. No se inició sesión con cuentas ajenas ni se probaron operaciones administrativas en producción.

Una comprobación de solo lectura confirmó el estado de la configuración de correo y los permisos de lectura anónima. No se enviaron solicitudes, correos ni puntajes, ni se realizaron sorteos. Este informe no certifica accesibilidad, rendimiento, cumplimiento normativo ni seguridad integral. No se verificaron la configuración externa de copias de seguridad, la entrega real de correo ni el uso por parte de colaboradores.

### Estado comprobado

- Directorio: 12 contactos y 12 etiquetas de agrupación. Hay etiquetas de áreas, segmentos comerciales y cargos; requieren una taxonomía común.
- Comunicados: sin publicaciones en el momento de la revisión. Ranking: sin registros.
- Correo de Amigo secreto: configuración ausente; no habilitado ni probado con un envío real.
- Directorio, comunicados y ranking: lectura permitida sin iniciar sesión. Buzón, lista de administradores y sorteos: lectura anónima rechazada.
- Conocimiento: ocho guías de orientación incluidas en el código; no constituyen un repositorio de políticas oficiales editables.

## Mejoras prioritarias

### 1. Definir el acceso y la separación de responsabilidades · Alta

**Hallazgo:** el contenido general y los contactos se pueden consultar sin identificación. Los administradores autorizados comparten permisos amplios sobre buzón, publicaciones, directorio, sorteos y otros administradores. Hay protección específica de la cuenta principal.

**Recomendación:** decidir qué información debe ser pública y cuál requiere acceso corporativo. Si se busca una intranet privada, implementar identidad para colaboradores y ajustar las reglas de los recursos internos. Separar roles de contenido, atención de solicitudes y organización de eventos. Mantener una decisión explícita sobre el canal sin nombre, evitando confundirlo con anonimato técnico.

**Resultado esperado:** cada persona consulta y gestiona únicamente los recursos que le corresponden. La decisión de privacidad debe preceder a la carga de documentos internos.

### 2. Convertir el buzón en un proceso de atención · Alta

**Hallazgo:** el formulario guarda mensajes y Administración puede leerlos o eliminarlos. No existen número de caso, estado, responsable, historial de respuesta ni seguimiento para quien lo envió.

**Recomendación:** incorporar identificador, categoría, responsable y estados «Nuevo / En atención / Resuelto», con fecha de actualización. Definir tiempos de atención por área. Para mensajes sin nombre, estudiar un código privado de consulta que no obligue a revelar identidad. Separar el correo de contacto del texto libre cuando la persona desee respuesta.

**Resultado esperado:** la persona sabe que su solicitud fue recibida y puede conocer su avance; Administración conserva trazabilidad.

### 3. Habilitar edición y ciclo de vida del contenido · Alta

**Hallazgo:** el panel permite crear y eliminar noticias y contactos; no ofrece edición de esos registros. Las guías se mantienen directamente en el código. No existe una vista editorial con borradores, vigencia, responsable y versiones.

**Recomendación:** priorizar editar contactos/noticias e importar contactos con vista previa y detección de duplicados. Después, añadir borrador, publicación, destacado, fecha de revisión y archivo recuperable. Incorporar autor y registro de cambios. Evitar utilizar eliminación como sustituto de una corrección.

**Resultado esperado:** corregir un correo o actualizar un comunicado sin perder su referencia y sin intervención técnica.

### 4. Completar la operación de Amigo secreto · Alta, antes del lanzamiento

**Hallazgo:** ya existen guardado de parejas, respaldo, exportación, recuperación, control de intentos y distinción entre correo aceptado y resultado incierto. Falta conectar el servicio de correo en producción.

**Recomendación inmediata:** el titular debe conectar su cuenta, revisar la plantilla y comprobar cuota vigente y recepción con un grupo pequeño de prueba consentido. Probar también reenvío y recuperación sin cambiar parejas. La aceptación del proveedor no confirma que el mensaje llegó a la bandeja.

**Siguiente etapa:** añadir una prueba de configuración desde el panel. Si el volumen o la importancia del evento lo requieren, trasladar el envío a una cola que continúe al cerrar el navegador. Permitir revocar o reemplazar una invitación individual: actualmente archivar suspende todos los enlaces del sorteo. Evaluar exclusiones entre participantes solo si la organización las necesita.

### 5. Dar utilidad diaria al inicio y al calendario · Alta/Media

**Hallazgo:** los accesos rápidos están bien ubicados. El espacio de comunicados no tiene contenido y el calendario no tiene una fuente administrable de actividades; la fecha especial incorporada es Navidad. Tampoco hay un catálogo administrable de aplicaciones de trabajo.

**Recomendación:** publicar un comunicado real de bienvenida y asignar un responsable editorial. Incorporar accesos aprobados a herramientas, formularios y documentos de uso frecuente. Mostrar «Próximas actividades» con fecha, responsable y acción; ofrecer calendario completo cuando existan eventos reales.

**Resultado esperado:** encontrar un recurso o una actividad sin consultar otro canal. Priorizar contenido vigente sobre nuevos bloques decorativos.

### 6. Unificar directorio, equipo y áreas · Media

**Hallazgo:** «Nuestro equipo» agrupa los mismos contactos del directorio; no representa jerarquías. El listado de áreas del formulario de solicitudes es independiente y usa otras denominaciones.

**Recomendación:** mantener un catálogo único de áreas. Ofrecer personas y áreas como vistas conectadas de un mismo recurso, con filtros claros. Añadir función del contacto y «en qué puede ayudarte» antes de ampliar datos personales. Validar direcciones y normalizar correos. Incorporar relaciones de jefatura únicamente con información oficial confirmada.

**Resultado esperado:** encontrar al responsable correcto y evitar categorías contradictorias entre pantallas.

### 7. Transformar las guías en recursos accionables · Media

**Hallazgo:** la búsqueda «vacaciones» encuentra una guía, pero esta remite al responsable o a RRHH para conocer el procedimiento. No incluye formulario oficial, política vigente ni fecha de revisión.

**Recomendación:** cada recurso debe indicar pasos concretos, enlace oficial, responsable, vigencia y última revisión. Mantener visible la diferencia entre una orientación general y una política aprobada. Asignar un propietario de contenido por área y habilitar actualización editorial.

**Resultado esperado:** completar la siguiente acción desde la guía, con información validada por la empresa.

### 8. Ampliar búsqueda y hacer honestas las notificaciones · Media

**Hallazgo:** el buscador funciona con secciones, títulos/categorías de guías y nombres/áreas de contactos. Limita los resultados a ocho, sin una vista completa, y no busca el cuerpo de las guías ni los comunicados. El indicador de novedades se activa cuando existe alguna noticia; no registra qué leyó la persona.

**Recomendación:** agrupar resultados por tipo, mostrar cantidad y «Ver todos», e incorporar comunicados, documentos y herramientas según sus permisos. Añadir registro de lectura o presentar la campana como acceso a publicaciones, sin sugerir novedades personales que no se están midiendo. Unificar nombres como «Guías y recursos» y «Centro de conocimiento».

### 9. Pulir la experiencia navideña y el juego · Media

**Hallazgo:** la campaña conserva una identidad reconocible y permite pausar animaciones. El video se abre una vez por sesión de navegador. En el selector móvil del juego, la miniatura de VictorIA Clásica aparece vacía; el estilo calculado es `background-image: none`. El nombre del archivo contiene espacios y se inserta en una URL CSS sin comillas.

**Recomendación:** corregir la miniatura y comprobar ambos personajes. Mantener el saludo disponible y permitir «No volver a mostrar en esta campaña», conservando su reproducción manual. Gestionar inicio/fin de campañas y recuperación del tema habitual desde configuración. Mejorar la explicación breve del juego y conservarlo como actividad opcional. El ranking actual acepta puntajes del cliente: no utilizarlo para premios o decisiones sin validación adicional.

### 10. Medir, proteger la operación y facilitar mantenimiento · Media

**Hallazgo:** existen pruebas automáticas, reglas de acceso y carga diferida de rutas. No se encontró instrumentación de uso/errores en el código revisado ni un flujo de recuperación de eliminaciones del contenido general. El envío del sorteo depende de la sesión abierta. Hay componentes extensos y más de siete mil líneas en una hoja de estilos compartida.

**Recomendación:** medir errores, búsquedas sin resultado y finalización de tareas, sin registrar mensajes privados ni enlaces del sorteo. Revisar protección frente a abuso de formularios y puntajes, preservando el propósito del canal sin nombre. Confirmar copias de seguridad y practicar una restauración. Incorporar pruebas de recorridos críticos y un entorno de revisión antes de producción. Después, dividir estilos y componentes por módulo y crear variantes compartidas de botones, formularios y estados.

**Límite:** no se confirmó si existen copias, alertas o controles externos a este repositorio. Deben verificarse antes de afirmar que faltan.

## Orden de ejecución propuesto

| Etapa     | Entregables                                                                                            | Condición para darla por terminada                                                            |
| --------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Primero   | Decisión de privacidad y roles, responsables de contenido, miniatura del juego, preparación del correo | Alcance aprobado; corrección visual verificada; recepción del correo probada antes del evento |
| Después   | Edición de contactos/noticias, catálogo de áreas, contenidos oficiales y accesos de trabajo            | Un administrador corrige información sin desarrollo y un colaborador llega a un recurso útil  |
| Siguiente | Solicitudes con seguimiento, actividades reales y buscador ampliado                                    | Se puede seguir un caso de principio a fin y encontrar contenido por tarea                    |
| Evolución | Auditoría de cambios, recuperación, métricas y campañas configurables                                  | Operación trazable, restauración practicada y mejoras guiadas por evidencia                   |

La secuencia no constituye una estimación de fechas o presupuesto. Depende del número de colaboradores, responsables disponibles, requisitos de privacidad y volumen de envíos.

## Cómo validar que mejoró

Probar con colaboradores representativos tres tareas: encontrar a un contacto, localizar el procedimiento de una ausencia y enviar/consultar una solicitud. Medir finalización, tiempo y necesidad de ayuda. Registrar búsquedas sin resultados, vigencia de contenidos, tiempo de primera atención y fallos del correo. Definir objetivos después de obtener una línea base; no existe aún evidencia para asignar una puntuación de satisfacción o prometer un porcentaje de mejora.

## Evidencia técnica

Las observaciones se basan en la versión indicada y en la revisión de producción de esa fecha:

- [Permisos de datos y administradores](../firestore.rules).
- [Gestión de contenido y buzón](../src/components/Admin.jsx), [solicitudes](../src/components/FeedbackForm.jsx) y [administradores](../src/components/AdminManagers.jsx).
- [Búsqueda y novedades](../src/components/DynamicHeader.jsx), [inicio y calendario](../src/components/Dashboard.jsx).
- [Guías actuales](../src/data/knowledge.js), [directorio](../src/components/HelpDirectory.jsx) y [vista de equipo](../src/components/OrgChart.jsx).
- [Operación del sorteo](../src/lib/secretSantaStore.js), [petición de correo](../src/lib/secretSantaEmail.js) y [documentación](amigo-secreto.md).
- [Selector del juego](../src/components/ActiveBreak.jsx), [frecuencia de bienvenida](../src/lib/welcome.js), [automatización de comprobaciones](../.github/workflows/check.yml).
