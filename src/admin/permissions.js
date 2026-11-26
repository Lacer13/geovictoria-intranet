// The catalog is shared by the editor, navigation and session resolver.
// Firestore enforces the same keys independently; see the parity test.
export const PERMISSION_GROUPS = [
  {
    id: "reports",
    label: "Buzón de reportes",
    permissions: [
      { id: "reports.view", label: "Consultar reportes privados" },
      {
        id: "reports.delete",
        label: "Eliminar reportes",
        requires: ["reports.view"],
      },
    ],
  },
  {
    id: "news",
    label: "Noticias",
    permissions: [
      { id: "news.create", label: "Crear publicaciones" },
      { id: "news.edit", label: "Editar publicaciones" },
      { id: "news.delete", label: "Eliminar publicaciones" },
    ],
  },
  {
    id: "directory",
    label: "Directorio de soporte",
    permissions: [
      { id: "directory.create", label: "Añadir contactos" },
      { id: "directory.edit", label: "Editar contactos" },
      { id: "directory.delete", label: "Eliminar contactos" },
    ],
  },
  {
    id: "santa",
    label: "Amigo secreto",
    permissions: [
      {
        id: "santa.view",
        label: "Consultar participantes, enlaces y asignaciones privadas",
      },
      {
        id: "santa.manage",
        label: "Crear, sortear, archivar y restaurar",
        requires: ["santa.view"],
      },
      {
        id: "santa.mail",
        label: "Configurar y enviar correos",
        requires: ["santa.view"],
      },
    ],
  },
  {
    id: "quiz",
    label: "Concurso en vivo",
    permissions: [
      { id: "quiz.manage", label: "Preparar y conducir concursos" },
    ],
  },
  {
    id: "wall",
    label: "Mural navideño",
    permissions: [
      { id: "wall.moderate", label: "Consultar y moderar todos los saludos" },
    ],
  },
  {
    id: "scores",
    label: "Pausa activa",
    permissions: [
      { id: "scores.manage", label: "Consultar y retirar puntajes" },
    ],
  },
  {
    id: "access",
    label: "Personas y perfiles",
    permissions: [
      {
        id: "access.manage",
        label:
          "Autorizar personas y administrar perfiles dentro de mis permisos",
      },
    ],
  },
];
export const PERMISSIONS = PERMISSION_GROUPS.flatMap(
  (group) => group.permissions,
);
export const ALL_PERMISSIONS = PERMISSIONS.map((permission) => permission.id);
export const PROFILE_TEMPLATES = [
  {
    name: "Administrador general",
    description: "Gestión completa de los módulos y de los accesos.",
    permissions: ALL_PERMISSIONS,
  },
  {
    name: "Editor de contenidos",
    description:
      "Publica y actualiza noticias y contactos; no puede eliminarlos ni administrar accesos.",
    permissions: [
      "news.create",
      "news.edit",
      "directory.create",
      "directory.edit",
      "wall.moderate",
    ],
  },
  {
    name: "Organizador de eventos",
    description: "Gestiona intercambios, sus correos y los concursos.",
    permissions: ["santa.view", "santa.manage", "santa.mail", "quiz.manage"],
  },
  {
    name: "Consulta de reportes",
    description: "Puede consultar el buzón, sin eliminar reportes.",
    permissions: ["reports.view"],
  },
];

export function togglePermission(current, key, checked) {
  const next = new Set(current);
  const definition = PERMISSIONS.find((permission) => permission.id === key);
  if (!definition) return [...next];
  if (checked) {
    next.add(key);
    definition.requires?.forEach((required) => next.add(required));
  } else {
    next.delete(key);
    for (const permission of PERMISSIONS)
      if (permission.requires?.includes(key)) next.delete(permission.id);
  }
  return ALL_PERMISSIONS.filter((permission) => next.has(permission));
}

export function normalizeProfile(values) {
  const name = String(values.name || "")
    .trim()
    .replace(/\s+/g, " ");
  const description = String(values.description || "").trim();
  if (!name || name.length > 60)
    throw Error("Indica un nombre de hasta 60 caracteres para el perfil.");
  if (description.length > 200)
    throw Error("La descripción admite hasta 200 caracteres.");
  if (
    !Array.isArray(values.permissions) ||
    values.permissions.some(
      (permission) => !ALL_PERMISSIONS.includes(permission),
    )
  )
    throw Error("El perfil contiene permisos no reconocidos.");
  const permissions = ALL_PERMISSIONS.filter((permission) =>
    values.permissions.includes(permission),
  );
  if (!permissions.length)
    throw Error("Elige al menos un permiso para este perfil.");
  for (const permission of PERMISSIONS)
    if (
      permissions.includes(permission.id) &&
      permission.requires?.some((required) => !permissions.includes(required))
    )
      throw Error(`«${permission.label}» requiere permiso de consulta.`);
  return { name, description, permissions, active: values.active !== false };
}

export function resolveAccess({
  claims = {},
  emailVerified = false,
  membership = null,
  profile = null,
  profileId = "",
} = {}) {
  // An explicit membership always overrides an old custom claim, including revocation.
  if (membership) {
    if (
      !emailVerified ||
      membership.active !== true ||
      !["owner", "admin"].includes(membership.role)
    )
      return null;
    if (membership.role === "owner")
      return {
        owner: true,
        label: "Administrador principal",
        permissions: [...ALL_PERMISSIONS],
        profileId: "",
      };
    if (!Object.hasOwn(membership, "profileId"))
      return {
        owner: false,
        label: "Acceso completo · Sin perfil asignado",
        permissions: [...ALL_PERMISSIONS],
        profileId: "",
      };
    if (
      typeof membership.profileId !== "string" ||
      !/^[a-zA-Z0-9_-]{1,80}$/.test(membership.profileId)
    )
      return null;
    if (
      profileId !== membership.profileId ||
      !profile ||
      profile.active !== true ||
      !Array.isArray(profile.permissions)
    )
      return null;
    return {
      owner: false,
      label: profile.name,
      profileId,
      permissions: ALL_PERMISSIONS.filter((permission) =>
        profile.permissions?.includes(permission),
      ),
    };
  }
  if (claims.admin === true)
    return {
      owner: true,
      label: "Administrador principal",
      permissions: [...ALL_PERMISSIONS],
      profileId: "",
    };
  return null;
}
export function canGrant(actor, permissions) {
  return (
    !!actor &&
    (actor.owner ||
      permissions.every((permission) => actor.permissions.includes(permission)))
  );
}
