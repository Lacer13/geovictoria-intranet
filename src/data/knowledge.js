export const categories = [
  "Todos",
  "Primeros pasos",
  "Tecnología",
  "Personas y cultura",
  "Procesos",
];
export const articles = [
  {
    id: "bienvenida",
    title: "Tu primer día en GeoVictoria",
    category: "Primeros pasos",
    time: 3,
    intro: "Una pequeña guía para empezar a conectar con tu equipo.",
    sections: [
      [
        "Conoce tu espacio",
        "Desde Mi inicio puedes consultar los comunicados publicados, encontrar a las personas del equipo y acceder a las herramientas de la intranet. Usa la búsqueda de la barra superior para moverte más rápido.",
      ],
      [
        "Encuentra a las personas indicadas",
        "Revisa el directorio de ayuda y busca por nombre o área. Si aún no tienes un contacto asignado para tu incorporación, consulta con tu responsable directo.",
      ],
      [
        "Prepara tus accesos",
        "Solicita las cuentas y herramientas que necesites a tu responsable o al área de tecnología. Nunca compartas contraseñas ni códigos de verificación.",
      ],
    ],
  },
  {
    id: "accesos",
    title: "Correo, cuentas y accesos seguros",
    category: "Tecnología",
    time: 3,
    intro: "Buenas prácticas para cuidar tus accesos de trabajo.",
    sections: [
      [
        "Activa la verificación en dos pasos",
        "Actívala en los servicios que la permitan y guarda tus métodos de recuperación en un lugar seguro. Utiliza una contraseña única para cada cuenta.",
      ],
      [
        "Si no puedes entrar",
        "Verifica tu dirección de correo y utiliza el proceso de recuperación del servicio. Si el problema continúa, contacta al área de soporte desde el directorio e indica la aplicación y el mensaje de error.",
      ],
      [
        "Antes de abrir un enlace",
        "Comprueba el remitente y el dominio. Si un mensaje solicita credenciales o tiene un comportamiento inusual, consulta con soporte por un canal que ya conozcas.",
      ],
    ],
  },
  {
    id: "soporte",
    title: "Cómo pedir ayuda a soporte",
    category: "Tecnología",
    time: 2,
    intro:
      "La información correcta ayuda a resolver tu consulta con menos idas y vueltas.",
    sections: [
      [
        "Explica qué ocurre",
        "Indica la herramienta, qué intentabas hacer y qué sucedió. Añade el mensaje de error y la hora aproximada del incidente.",
      ],
      [
        "Comparte contexto útil",
        "Puedes incluir una captura si no contiene datos personales, contraseñas o información de clientes. Indica también si el problema afecta a otras personas.",
      ],
      [
        "Encuentra el canal adecuado",
        "Busca al equipo de soporte en el directorio. Para solicitudes sobre tu experiencia de trabajo, utiliza Te escuchamos.",
      ],
    ],
  },
  {
    id: "vacaciones",
    title: "Planifica tus vacaciones y permisos",
    category: "Personas y cultura",
    time: 2,
    intro:
      "Organiza tu ausencia y deja a tu equipo con la información que necesita.",
    sections: [
      [
        "Coordina con anticipación",
        "Consulta con tu responsable y con Recursos Humanos el proceso vigente, tu saldo y los plazos de solicitud. Esta guía no sustituye las políticas internas ni confirma la aprobación de una ausencia.",
      ],
      [
        "Prepara el relevo",
        "Deja una lista de pendientes, responsables y fechas. Comparte los documentos de trabajo por los canales autorizados y configura tu mensaje de ausencia.",
      ],
      [
        "Para las fiestas",
        "Confirma los horarios de atención y las coberturas con tu equipo. Los comunicados oficiales se publican en Mi inicio.",
      ],
    ],
  },
  {
    id: "gastos",
    title: "Prepara una rendición de gastos",
    category: "Procesos",
    time: 2,
    intro: "Reúne los respaldos antes de enviar tu solicitud.",
    sections: [
      [
        "Organiza tus comprobantes",
        "Reúne los comprobantes legibles y registra la fecha, el concepto y el motivo de cada gasto. Evita incluir información bancaria sensible en canales abiertos.",
      ],
      [
        "Confirma el procedimiento",
        "Consulta con Finanzas los requisitos, formatos, gastos admitidos y fechas de presentación vigentes. Los montos y aprobaciones dependen de la política interna.",
      ],
      [
        "Da seguimiento",
        "Conserva una copia del envío y consulta por el canal indicado si necesitas conocer su estado.",
      ],
    ],
  },
  {
    id: "equipos",
    title: "Solicita herramientas y equipos",
    category: "Procesos",
    time: 2,
    intro:
      "Prepara tu solicitud para que pueda ser evaluada por el área responsable.",
    sections: [
      [
        "Describe la necesidad",
        "Explica qué tarea requiere el equipo o la herramienta, quién lo utilizará y desde cuándo se necesita.",
      ],
      [
        "Coordina la aprobación",
        "Consulta con tu responsable el proceso de autorización antes de adquirir o instalar software. Usa el directorio para ubicar a Tecnología.",
      ],
      [
        "Cuida la información",
        "Antes de entregar o reemplazar un equipo, coordina el respaldo y la transferencia con soporte.",
      ],
    ],
  },
  {
    id: "bienestar",
    title: "Un respiro también es parte del día",
    category: "Personas y cultura",
    time: 2,
    intro: "Pequeñas ideas para desconectarte un momento y volver con energía.",
    sections: [
      [
        "Cambia de actividad",
        "Levántate, toma agua o dedica unos minutos a una actividad que disfrutes. Encuentra el juego de VictorIA en Pausa activa.",
      ],
      [
        "Conecta con tu equipo",
        "Agradecer una ayuda o compartir una conversación breve también crea un mejor espacio de trabajo.",
      ],
      [
        "Pide apoyo cuando lo necesites",
        "Puedes encontrar a Recursos Humanos en el directorio o escribir una solicitud desde Te escuchamos.",
      ],
    ],
  },
  {
    id: "intranet",
    title: "Sácale más provecho a tu intranet",
    category: "Primeros pasos",
    time: 2,
    intro: "Tus personas, recursos y novedades están a pocos clics.",
    sections: [
      [
        "Busca desde cualquier página",
        "Abre el buscador de la barra superior o utiliza Ctrl + K (⌘ + K en Mac). Puedes buscar guías, secciones y contactos disponibles.",
      ],
      [
        "Guarda tus guías",
        "En el centro de conocimiento puedes marcar artículos como favoritos. Tus favoritos se guardan en este navegador.",
      ],
      [
        "Hazla tuya",
        "Cambia entre modo claro y oscuro con el botón de la luna o el sol. En un móvil, abre el menú desde la esquina superior izquierda.",
      ],
    ],
  },
];
