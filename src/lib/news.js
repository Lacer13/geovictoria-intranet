export const NEWS_READ_KEY = "geoNewsRead:v1";
export function publicationVersion(item) {
  const text = JSON.stringify([
    item.title,
    item.desc,
    item.type,
    item.timestamp,
  ]);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}
export function parseReadNews(value) {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(
          ([id, version]) =>
            id.length <= 1500 &&
            typeof version === "string" &&
            /^[a-f\d]{1,8}$/.test(version),
        )
        .slice(-1000),
    );
  } catch {
    return {};
  }
}
export function isPublicationRead(item, read = {}) {
  return (
    Object.hasOwn(read, item.id) && read[item.id] === publicationVersion(item)
  );
}
