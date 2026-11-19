import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import {
  AREA_CHARACTERS,
  ASSET_SOURCES,
  loadAssets,
} from "../src/game/characters.js";
import {
  CLIPS,
  SPRITE_COLUMNS,
  SPRITE_SIZE,
  SPRITE_ROWS,
} from "../src/game/animation.js";

test("all twelve exported sheets contain 184 complete frames with 48 celebration frames and the exact approved source checksum", async () => {
  let total = 0;
  for (const c of AREA_CHARACTERS) {
    const meta = JSON.parse(await fs.readFile("public" + c.metadata, "utf8"));
    const original = await fs.readFile("public" + c.src);
    assert.equal(
      meta.sourceSha256,
      crypto.createHash("sha256").update(original).digest("hex"),
    );
    assert.deepEqual(meta.parts, c.parts);
    assert.equal(meta.celebration, c.celebration);
    assert.equal(meta.power.id, c.power.id);
    const image = await loadImage("public" + c.sprite);
    assert.equal(image.width, SPRITE_COLUMNS * SPRITE_SIZE);
    assert.equal(image.height, SPRITE_ROWS * SPRITE_SIZE);
    const canvas = createCanvas(image.width, image.height),
      ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const frames = Object.entries(meta.frames);
    assert.equal(frames.length, 184);
    assert.equal(meta.clips.victory.frames, 48);
    total += frames.length;
    for (const [name, frame] of frames) {
      const pixels = ctx.getImageData(frame.x, frame.y, frame.w, frame.h).data;
      let occupied = 0;
      for (let y = 0; y < SPRITE_SIZE; y++)
        for (let x = 0; x < SPRITE_SIZE; x++) {
          const alpha = pixels[(y * SPRITE_SIZE + x) * 4 + 3];
          if (alpha > 96) occupied++;
          if (x < 2 || y < 2 || x >= SPRITE_SIZE - 2 || y >= SPRITE_SIZE - 2)
            assert.ok(alpha <= 32, `${c.id}/${name}: cropped contour`);
        }
      assert.ok(occupied > 1500, `${c.id}/${name}: empty or incomplete frame`);
    }
    for (const [name, clip] of Object.entries(CLIPS)) {
      const a = ctx.getImageData(
        0,
        clip.row * SPRITE_SIZE,
        SPRITE_SIZE,
        SPRITE_SIZE,
      ).data;
      const b = ctx.getImageData(
        Math.floor(clip.frames / 4) * SPRITE_SIZE,
        clip.row * SPRITE_SIZE,
        SPRITE_SIZE,
        SPRITE_SIZE,
      ).data;
      assert.notDeepEqual(a, b, `${c.id}/${name}: motionless clip`);
    }
  }
  assert.equal(total, 2208);
});

test("resource loading requests only the chosen character and supports a missing-image fallback", async () => {
  const original = globalThis.Image,
    requested = [];
  class FakeImage {
    naturalWidth = 1254;
    set src(value) {
      requested.push(value);
      queueMicrotask(() =>
        value.includes("missing") ? this.onerror?.() : this.onload?.(),
      );
    }
  }
  globalThis.Image = FakeImage;
  try {
    const progress = [];
    const tecno = await loadAssets(
      (value) => progress.push(value),
      { ...AREA_CHARACTERS[0], animation: null },
      { retry: true },
    );
    assert.equal(tecno.characterId, "tecnoia");
    assert.equal(progress.at(-1), 1);
    assert.deepEqual(tecno.failed, []);
    assert.deepEqual(
      new Set(requested),
      new Set([
        ...ASSET_SOURCES,
        AREA_CHARACTERS[0].src,
        AREA_CHARACTERS[0].sprite,
      ]),
    );
    requested.length = 0;
    await loadAssets(() => {}, AREA_CHARACTERS[1]);
    assert.deepEqual(
      new Set(requested),
      new Set([AREA_CHARACTERS[1].src, AREA_CHARACTERS[1].sprite]),
    );
    const broken = await loadAssets(() => {}, {
      id: "missing",
      src: "/missing.png",
      sprite: "/missing.webp",
    });
    assert.deepEqual(broken.failed.sort(), ["/missing.png", "/missing.webp"]);
    assert.equal(broken.images["/missing.png"], null);
    assert.ok(ASSET_SOURCES.every((src) => broken.images[src]));
  } finally {
    if (original) globalThis.Image = original;
    else delete globalThis.Image;
  }
});
