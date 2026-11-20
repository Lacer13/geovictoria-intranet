import { normalize } from "./preferences.js";
export const portalPages = [
  { title: "Mi inicio", detail: "Accesos rápidos", path: "/" },
  { title: "Nuestro equipo", detail: "Personas y áreas", path: "/organigrama" },
  {
    title: "Directorio de ayuda",
    detail: "Personas y contactos",
    path: "/directorio",
  },
  {
    title: "Guías y recursos",
    detail: "Centro de conocimiento",
    path: "/wiki",
  },
  {
    title: "Te escuchamos",
    detail: "Solicitudes y reportes",
    path: "/solicitudes",
  },
  { title: "Navidad en equipo", detail: "Mural de saludos con firma o anónimos e ideas para celebrar", path: "/navidad" },
  {
    title: "Amigo secreto",
    detail: "Sorteo, invitación y regalos",
    path: "/amigo-secreto",
  },
  { title: "Pausa activa", detail: "Un respiro con VictorIA", path: "/juego" },
  {
    title: "Concurso en vivo",
    detail: "Exposiciones, preguntas, QR, competencia y bonus navideño",
    path: "/concurso",
  },
  {
    title: "Novedades",
    detail: "Comunicados, logros y celebraciones",
    path: "/novedades",
  },
];
export const searchTypes = [
  "Todo",
  "Secciones",
  "Guías",
  "Personas",
  "Publicaciones",
];
export function buildSearchIndex({
  articles = [],
  directory = [],
  news = [],
} = {}) {
  return [
    ...portalPages.map((p) => ({
      ...p,
      id: `page:${p.path}`,
      type: "Secciones",
    })),
    ...articles.map((a) => ({
      id: `guide:${a.id}`,
      title: a.title,
      detail: a.category,
      body: [a.intro, ...a.sections.flat()].join(" "),
      type: "Guías",
      path: `/wiki?articulo=${encodeURIComponent(a.id)}`,
    })),
    ...directory.map((c) => ({
      id: `contact:${c.id}`,
      title: c.name,
      detail: c.department,
      body: c.email,
      type: "Personas",
      path: `/directorio?q=${encodeURIComponent(c.email || c.name)}`,
    })),
    ...news.map((n) => ({
      id: `news:${n.id}`,
      title: n.title,
      detail: n.date,
      body: n.desc,
      type: "Publicaciones",
      path: `/novedades?publicacion=${encodeURIComponent(n.id)}`,
    })),
  ];
}
export function searchIndex(index, term = "", type = "Todo") {
  const query = normalize(term);
  const words = query.split(/\s+/).filter(Boolean);
  return index
    .filter((r) => type === "Todo" || r.type === type)
    .map((r, position) => {
      const title = normalize(r.title);
      const detail = normalize(r.detail);
      const text = `${title} ${detail} ${normalize(r.body)}`;
      const matches = words.every((word) => text.includes(word));
      const rank = !query
        ? 0
        : title === query
          ? 100
          : title.startsWith(query)
            ? 80
            : title.includes(query)
              ? 60
              : detail.includes(query)
                ? 40
                : 20;
      return { result: r, matches, rank, position };
    })
    .filter((r) => r.matches)
    .sort((a, b) => b.rank - a.rank || a.position - b.position)
    .map((r) => r.result);
}
