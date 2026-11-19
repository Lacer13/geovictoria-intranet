// Shared geometry for source extraction and future metadata-driven playback.
// Source artwork may use explicit rectangles; never infer a fractional grid.
function integer(value, name, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum)
    throw new Error(`${name} must be an integer >= ${minimum}`);
  return value;
}

export function validateFrameRects(pages, frames) {
  if (!Array.isArray(pages) || !pages.length)
    throw new Error("At least one image page is required");
  for (const page of pages) {
    integer(page.width, "page width", 1);
    integer(page.height, "page height", 1);
  }
  if (!Array.isArray(frames) || !frames.length)
    throw new Error("At least one frame is required");
  const names = new Set();
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    if (typeof frame.name !== "string" || !/^[a-zA-Z0-9_-]+$/.test(frame.name) || names.has(frame.name))
      throw new Error("Every frame must have a unique safe name (letters, numbers, underscores or hyphens)");
    names.add(frame.name);
    integer(frame.page, `${frame.name}: page`);
    const page = pages[frame.page];
    if (!page) throw new Error(`${frame.name}: unknown page`);
    integer(frame.x, `${frame.name}: x`);
    integer(frame.y, `${frame.name}: y`);
    integer(frame.w, `${frame.name}: width`, 1);
    integer(frame.h, `${frame.name}: height`, 1);
    if (frame.x + frame.w > page.width || frame.y + frame.h > page.height)
      throw new Error(`${frame.name}: rectangle outside image`);
    for (let j = 0; j < i; j++) {
      const other = frames[j];
      if (
        frame.page === other.page &&
        frame.x < other.x + other.w &&
        other.x < frame.x + frame.w &&
        frame.y < other.y + other.h &&
        other.y < frame.y + frame.h
      )
        throw new Error(`${frame.name}: overlaps ${other.name}`);
    }
  }
  return frames;
}

export function createSpriteLayout(
  names,
  {
    columns,
    rows,
    cellWidth,
    cellHeight = cellWidth,
    marginX = 0,
    marginY = 0,
    spacingX = 0,
    spacingY = 0,
  },
) {
  if (!Array.isArray(names) || !names.length)
    throw new Error("At least one frame name is required");
  integer(columns, "columns", 1);
  rows ??= Math.ceil(names.length / columns);
  integer(rows, "rows", 1);
  integer(cellWidth, "cellWidth", 1);
  integer(cellHeight, "cellHeight", 1);
  for (const [key, value] of Object.entries({ marginX, marginY, spacingX, spacingY }))
    integer(value, key);
  const capacity = columns * rows;
  const pages = Array.from({ length: Math.ceil(names.length / capacity) }, () => ({
    width: marginX * 2 + columns * cellWidth + (columns - 1) * spacingX,
    height: marginY * 2 + rows * cellHeight + (rows - 1) * spacingY,
  }));
  const frames = names.map((name, index) => ({
    name,
    page: Math.floor(index / capacity),
    x: marginX + (index % columns) * (cellWidth + spacingX),
    y: marginY + Math.floor((index % capacity) / columns) * (cellHeight + spacingY),
    w: cellWidth,
    h: cellHeight,
  }));
  validateFrameRects(pages, frames);
  return { pages, frames };
}

// Inspect source pixels before scaling or clipping, so an export cannot hide
// an empty cell or a contour crossing its extraction rectangle.
export function inspectFramePixels(pixels, width, height, { edge = 2 } = {}) {
  integer(width, "pixel width", 1);
  integer(height, "pixel height", 1);
  integer(edge, "edge");
  if (pixels.length !== width * height * 4)
    throw new Error("Pixel buffer does not match frame dimensions");
  let occupied = 0;
  let edgePixels = 0;
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const alpha = pixels[(y * width + x) * 4 + 3];
      if (alpha > 96) {
        occupied++;
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
      if (alpha > 32 && (x < edge || y < edge || x >= width - edge || y >= height - edge))
        edgePixels++;
    }
  return {
    occupied,
    edgePixels,
    bounds: occupied ? { x: left, y: top, w: right - left + 1, h: bottom - top + 1 } : null,
  };
}
