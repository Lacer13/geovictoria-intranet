export const atmosphereOptions = [
  {
    id: "soft",
    label: "Suave",
    description: "Pocos copos y luces tranquilas.",
  },
  {
    id: "festive",
    label: "Festivo",
    description: "Más nieve y un brillo sutil en las luces.",
  },
  {
    id: "off",
    label: "Decoración quieta",
    description: "Sin nieve y con los detalles navideños en pausa.",
  },
];

export function atmospherePreference(saved, previousMotion) {
  return atmosphereOptions.some((option) => option.id === saved)
    ? saved
    : previousMotion === "off"
      ? "off"
      : "soft";
}

export function snowPattern(atmosphere) {
  const edges = [3, 97, 8, 92, 15, 85, 24, 76, 5, 95, 12, 88, 20, 80, 34, 66];
  return Array.from(
    { length: atmosphere === "off" ? 0 : atmosphere === "festive" ? 26 : 16 },
    (_, i) => ({
      left: atmosphere === "festive" ? 2 + ((i * 37 + 9) % 96) : edges[i],
      delay: -((i * 7 + 3) % 31),
      duration: 23 + ((i * 3) % 17),
      size: 16 + (i % 4) * 2,
      drift: (i % 2 ? -1 : 1) * (14 + (i % 23)),
    }),
  );
}
