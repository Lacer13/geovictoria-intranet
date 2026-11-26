export const ADMIN_MODULES = [
  {
    id: "feedbacks",
    query: "buzon",
    label: "Buzón de reportes",
    permissions: ["reports.view"],
  },
  {
    id: "news",
    query: "noticias",
    label: "Noticias",
    permissions: ["news.create", "news.edit", "news.delete"],
  },
  {
    id: "directory",
    query: "directorio",
    label: "Directorio de soporte",
    permissions: ["directory.create", "directory.edit", "directory.delete"],
  },
  {
    id: "admins",
    query: "accesos",
    label: "Personas y perfiles",
    permissions: ["access.manage"],
  },
  {
    id: "santa",
    query: "amigo-secreto",
    label: "Amigo secreto",
    permissions: ["santa.view"],
  },
  {
    id: "quiz",
    query: "concurso",
    label: "Concurso en vivo",
    permissions: ["quiz.manage"],
  },
  {
    id: "wall",
    query: "mural",
    label: "Mural navideño",
    permissions: ["wall.moderate"],
  },
  {
    id: "scores",
    query: "puntajes",
    label: "Puntajes",
    permissions: ["scores.manage"],
  },
];
export const allowedModules = (permissions) =>
  ADMIN_MODULES.filter((module) =>
    module.permissions.some((permission) => permissions.includes(permission)),
  );
export function requestedModule(query) {
  return ADMIN_MODULES.find(
    (module) => module.query === query || module.id === query,
  );
}
