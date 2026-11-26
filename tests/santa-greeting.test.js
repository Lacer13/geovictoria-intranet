import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createCanvas, loadImage, Path2D } from "@napi-rs/canvas";
import {
  GREETING_CHARACTERS,
  GREETING_DURATION,
  chooseGreetingCharacter,
  greetingAtlasParts,
  greetingPose,
} from "../src/lib/santaGreeting.js";
import { drawGreetingScene } from "../src/components/secretSanta/greetingScene.js";

test("each visit can select any game guardian without immediately repeating the previous one", () => {
  assert.equal(GREETING_CHARACTERS.length, 12);
  assert.equal(new Set(GREETING_CHARACTERS.map((c) => c.id)).size, 12);
  for (const previous of GREETING_CHARACTERS) {
    const choices = Array.from(
      { length: 11 },
      (_, i) => chooseGreetingCharacter(previous.id, () => (i + 0.5) / 11).id,
    );
    assert.equal(new Set(choices).size, 11);
    assert.ok(!choices.includes(previous.id));
  }
  for (const value of [-1, 1, 10, NaN, Infinity])
    assert.ok(chooseGreetingCharacter("", () => value)?.id);
});

test("the finite greeting decorates first, waves afterwards and settles without changing a draw", () => {
  assert.equal(greetingPose(1).decorated, false);
  assert.equal(greetingPose(3).decorated, true);
  assert.ok(greetingPose(2.4).handX > greetingPose(0).handX + 100);
  assert.ok(greetingPose(6).handY < greetingPose(0).handY - 60);
  assert.ok(Math.abs(greetingPose(6).deerWave) > 0.8);
  assert.equal(greetingPose(GREETING_DURATION).finished, true);
  assert.equal(Math.abs(greetingPose(GREETING_DURATION).bob), 0);
  assert.equal(Math.abs(greetingPose(GREETING_DURATION).deerNod), 0);
  assert.deepEqual(greetingPose(10000), greetingPose(GREETING_DURATION));
  assert.equal(greetingPose(-1).time, 0);
});

test("the lightweight atlases preserve every approved source and contain all three complete parts", async () => {
  const manifest = JSON.parse(
    await readFile("public/santa-greetings/manifest.json", "utf8"),
  );
  assert.equal(manifest.characters.length, 12);
  for (const character of GREETING_CHARACTERS) {
    const record = manifest.characters.find((item) => item.id === character.id);
    const original = await readFile(`public${character.source}`);
    assert.equal(
      createHash("sha256").update(original).digest("hex"),
      record.sourceSha256,
    );
    const bytes = await readFile(`public${character.atlas}`);
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      record.atlasSha256,
    );
    assert.ok(bytes.length < 50000);
    const image = await loadImage(bytes);
    assert.equal(image.width, 512);
    assert.equal(image.height, 256);
    assert.deepEqual(record.parts, greetingAtlasParts(character.parts));
    const canvas = createCanvas(512, 256),
      ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    for (const rect of Object.values(record.parts)) {
      const pixels = ctx.getImageData(...rect).data;
      let visible = 0;
      for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 96) visible++;
      assert.ok(visible > 1500, `${character.id} has a missing part`);
    }
  }
});

test("all twelve characters render complete decoration and greeting frames inside the stage", async () => {
  globalThis.Path2D = Path2D;
  const canvas = createCanvas(1000, 420),
    ctx = canvas.getContext("2d");
  for (const character of GREETING_CHARACTERS) {
    const image = await loadImage(`public${character.atlas}`);
    const hashes = new Set();
    for (const time of [0, 1.8, 3.4, 5.8, GREETING_DURATION]) {
      drawGreetingScene(ctx, image, character, time);
      const pixels = ctx.getImageData(0, 0, 1000, 420).data;
      hashes.add(createHash("sha256").update(pixels).digest("hex"));
      let visible = 0;
      for (let y = 0; y < 420; y++)
        for (let x = 0; x < 1000; x++) {
          if (pixels[(y * 1000 + x) * 4 + 3] < 96) continue;
          visible++;
          assert.ok(
            x > 3 && x < 996 && y > 3 && y < 416,
            `${character.id} is clipped at ${time}s`,
          );
        }
      assert.ok(visible > 35000);
    }
    assert.equal(hashes.size, 5);
  }
});
