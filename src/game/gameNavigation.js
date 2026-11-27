const views = new Set(["juegos", "aventura", "arcade", "minijuegos", "memoria", "reflejos", "arena", "clasificaciones"]);
export function gameViewFromHash(hash) {
  if (String(hash).includes("sala=")) return "arena";
  const id = String(hash || "").replace(/^#/, "");
  return views.has(id) ? id : "juegos";
}
