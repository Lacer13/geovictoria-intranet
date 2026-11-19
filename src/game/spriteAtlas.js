import { validateFrameRects } from "./spriteLayout.js";

export function validateAnimationAtlas(atlas) {
  if (atlas.schemaVersion !== 2 || !atlas.frames || !atlas.clips)
    throw new Error("Expected a version 2 animation atlas");
  validateFrameRects(atlas.pages, Object.entries(atlas.frames).map(([name, f]) => ({ name, ...f })));
  for (const [name, clip] of Object.entries(atlas.clips)) {
    if (!Array.isArray(clip.frames) || !clip.frames.length || !Number.isFinite(clip.fps) || clip.fps <= 0 ||
      !Number.isFinite(clip.duration) || Math.abs(clip.duration - clip.frames.length / clip.fps) > 1e-8)
      throw new Error(`${name}: invalid frame rate or duration`);
    if (!Number.isSafeInteger(clip.reducedFrame) || clip.reducedFrame < 0 || clip.reducedFrame >= clip.frames.length)
      throw new Error(`${name}: invalid reduced-motion frame`);
    for (const frame of clip.frames)
      if (!Object.hasOwn(atlas.frames, frame)) throw new Error(`${name}: missing frame ${frame}`);
  }
  for (const [name, frame] of Object.entries(atlas.frames)) {
    const muzzle = frame.anchors?.muzzle;
    if (muzzle && (![muzzle.x, muzzle.y, muzzle.dx, muzzle.dy].every(Number.isFinite) || muzzle.x < 0 ||
      muzzle.x > frame.w || muzzle.y < 0 || muzzle.y > frame.h || Math.abs(Math.hypot(muzzle.dx, muzzle.dy) - 1) > 1e-8))
      throw new Error(`${name}: invalid muzzle anchor`);
  }
  return atlas;
}

// Select by the clip's ordered names, never by a hard-coded column count.
export function atlasFrame(atlas, name, seconds = 0, reduced = false) {
  const clip = atlas.clips[name];
  if (!clip) throw new Error(`Unknown animation: ${name}`);
  const time = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const elapsed = clip.loop ? time % clip.duration : Math.min(time, clip.duration);
  const index = reduced ? clip.reducedFrame : Math.min(clip.frames.length - 1, Math.floor(elapsed * clip.fps + 1e-8));
  return { ...atlas.frames[clip.frames[index]], name: clip.frames[index], index };
}

export function drawAtlasFrame(ctx, images, atlas, clip, seconds, { x = 0, y = 0, width = 320, reduced = false } = {}) {
  const frame = atlasFrame(atlas, clip, seconds, reduced), page = atlas.pages[frame.page], image = images[frame.page];
  if (!image || (image.naturalWidth || image.width) !== page.width || (image.naturalHeight || image.height) !== page.height)
    throw new Error("Atlas image unavailable or dimensions changed");
  ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, x, y, width, width * frame.h / frame.w);
  return frame;
}
