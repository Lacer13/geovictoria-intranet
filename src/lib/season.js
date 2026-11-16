export function limaDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return new Date(get("year"), get("month") - 1, get("day"));
}
export function christmasInfo(now = new Date()) {
  const today = limaDate(now);
  const year =
    today.getFullYear() +
    (today.getMonth() === 11 && today.getDate() > 25 ? 1 : 0);
  const days = Math.round(
    (Date.UTC(year, 11, 25) -
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
      86400000,
  );
  return { year, days };
}
export function downloadChristmasCalendar(year) {
  const text = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GeoVictoria//Intranet//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:navidad-${year}@geovictoria-intranet`,
    `DTSTAMP:${new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")}`,
    `DTSTART;VALUE=DATE:${year}1225`,
    `DTEND;VALUE=DATE:${year}1226`,
    "SUMMARY:Navidad",
    "DESCRIPTION:Un momento para compartir y agradecer.",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/calendar;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `navidad-${year}.ics`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
