# Perfiles de administración

Implementación del 25 de noviembre de 2026, publicada el 26 de noviembre junto con la tabla rápida de parejas y la configuración de primer ingreso. Consulta el [registro de producción](releases/perfiles-parejas-production-2026-11-26.json).

## Operación desde el panel

1. Ingresa a **Administración → Personas y perfiles → Perfiles**.
2. Pulsa **Crear perfil**. Puedes empezar desde cero o usar Administrador general, Editor de contenidos, Organizador de eventos o Consulta de reportes.
3. Indica un nombre, una descripción opcional y marca los permisos que correspondan. Guarda el perfil.
4. En **Personas**, autoriza un correo y elige su perfil. Para alguien que ya figura en la lista, usa **Editar acceso**.
5. Copia y comparte personalmente su enlace de activación. Autorizar el correo no envía un mensaje. La persona crea o recupera su propia cuenta y verifica el correo antes de ingresar.

Puedes duplicar perfiles, modificar sus permisos y deshabilitarlos. Antes de modificar uno existente se muestra cuántas personas lo tienen asignado. Cancelar una edición con cambios permite seguir editando o descartarlos.

Los cambios de perfil, las reasignaciones y las desactivaciones se escuchan durante la sesión. La pantalla retira las secciones y cierra los editores que dejan de estar autorizados. Las reglas evalúan los permisos vigentes en cada solicitud protegida. Ningún sistema puede retirar información que una persona ya haya leído o descargado.

## Permisos disponibles

| Área                | Acciones configurables                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Buzón de reportes   | Consultar información privada; eliminar reportes                                                                             |
| Noticias            | Crear; editar; eliminar                                                                                                      |
| Directorio          | Añadir; editar; eliminar contactos                                                                                           |
| Amigo secreto       | Consultar participantes, invitaciones y asignaciones privadas; crear/sortear/archivar/restaurar; configurar y enviar correos |
| Concurso en vivo    | Preparar y conducir concursos                                                                                                |
| Mural navideño      | Consultar y moderar todos los saludos                                                                                        |
| Pausa activa        | Consultar y retirar puntajes                                                                                                 |
| Personas y perfiles | Autorizar personas y administrar perfiles dentro de los permisos propios                                                     |

Eliminar reportes requiere poder consultarlos. Gestionar sorteos y enviar correos requieren consultar Amigo secreto; el editor incorpora esa dependencia automáticamente. La consulta de Amigo secreto incluye las parejas y los enlaces privados de todos los eventos: debe concederse solo a quienes necesiten esa información. Los permisos son globales por módulo, sin separación por evento o departamento.

Noticias, contactos y puntajes conservan sus lecturas públicas. Estos perfiles delimitan las acciones administrativas; no convierten toda la intranet en un sitio privado.

## Protección y compatibilidad

- La cuenta con `role: owner` tiene acceso completo y no puede ser modificada o eliminada desde el panel.
- Nadie puede modificar su propia autorización. Un administrador con perfil tampoco puede modificar ese mismo perfil. Otra persona con permisos suficientes debe hacerlo.
- Quien administra accesos solo puede asignar o modificar perfiles cuyos permisos anteriores y nuevos estén dentro de su propio alcance. Tener `access.manage` no permite otorgarse acceso completo ni cambiar a `owner`.
- Un perfil deshabilitado o inexistente bloquea el acceso de sus personas asignadas. Para recuperarlo, reactiva el perfil o asigna otro desde una cuenta autorizada.
- Los administradores anteriores, sin campo `profileId`, conservan el acceso completo hasta que se les asigne un perfil. No hay una migración automática que pueda dejarlos fuera.
- El claim `admin: true` sirve de acceso principal inicial cuando no existe una autorización explícita. Si existe, prevalecen su estado y perfil, incluso al revocar el acceso.
- Guardar perfiles y autorizaciones utiliza transacciones y revisiones para detectar ediciones simultáneas.
- Se conservan las cuentas desactivadas y los perfiles deshabilitados. No se ofrece eliminación física desde esta pantalla.

## Código y despliegue

El catálogo está en `src/admin/permissions.js`, la resolución de sesión en `src/admin/useAdminAccess.js`, las escrituras en `src/admin/accessStore.js` y la interfaz en `src/admin/access/`. `firestore.rules` aplica el mismo catálogo de forma independiente. Una prueba verifica su coincidencia exacta.

Publicar esta entrega requiere desplegar las reglas y Hosting del mismo código. No basta con publicar la interfaz. La primera publicación conserva los administradores existentes y no crea perfiles ni asigna permisos a personas reales automáticamente.

## Cuentas configuradas por solicitud expresa

El 26 de noviembre se asignó a `ldiazr@geovictoria.com` el perfil **Administrador sin Amigo secreto**, con todos los permisos de los otros módulos y ninguno de `santa.*`. No puede consultar eventos, participantes, parejas, entregas por correo o la configuración de ese módulo. Tampoco puede ampliar su propio perfil ni conceder a otra persona permisos de Amigo secreto. Su contraseña no se modificó.

`abautista@geovictoria.com` tiene el perfil Administrador general; `nlarriega@geovictoria.com` conserva su rol principal protegido. Se configuró la contraseña inicial solicitada para ambas cuentas, sin guardarla en el código de la aplicación ni en el registro de publicación. Las dos necesitan verificar su correo.

Antes de abrir el panel, la aplicación muestra **Elige tu propia contraseña**. El cambio utiliza Firebase Authentication. La pantalla compara la fecha `passwordUpdatedAt` de la cuenta autenticada con el marcador administrativo `passwordSetupAt`; no utiliza una marca del navegador ni permite escribir esa fecha desde Firestore. Si la persona ya estableció una contraseña nueva desde un enlace de recuperación, también puede continuar. Después del cambio aparece la verificación de correo cuando corresponda.

Este paso guía el primer ingreso en la interfaz. La autorización de datos continúa dependiendo de los permisos de Firestore y del correo verificado; no se presenta el marcador de contraseña como una restricción adicional de las reglas del servidor. Las contraseñas elegidas no se guardan en perfiles ni en documentos de Firestore.

Los campos y la consulta de la cuenta propia se basan en [UserInfo de Identity Platform](https://docs.cloud.google.com/identity-platform/docs/reference/rest/v1/UserInfo) y [accounts.lookup](https://docs.cloud.google.com/identity-platform/docs/reference/rest/v1/accounts/lookup).

Ver [estructura y revisión del código](arquitectura.md) para las separaciones realizadas y los límites de esta revisión.
