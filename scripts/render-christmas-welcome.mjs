import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeChristmasMusic } from "./christmas-music.mjs";

// Every input is a complete scene. No chroma key, alpha extraction or body masks.
const root = fileURLToPath(new URL("../", import.meta.url));
const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
const duration = 12;
const temporary = mkdtempSync(join(tmpdir(), "geovictoria-welcome-"));
const music = join(temporary, "christmas-music.wav");
const timeline = join(temporary, "poses.ffconcat");
const font =
  process.env.FONT_PATH ||
  (existsSync("/System/Library/Fonts/Supplemental/Arial.ttf")
    ? "/System/Library/Fonts/Supplemental/Arial.ttf"
    : "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf");
const poses = [
  "a",
  "a",
  "b",
  "a",
  "b",
  "a",
  "b",
  "a",
  "c",
  "c",
  "a",
  "b",
  "a",
  "b",
  "a",
  "b",
  "a",
  "c",
  "c",
  "a",
  "b",
  "a",
  "a",
  "a",
  "a",
  "a",
];
const entries = poses
  .map(
    (pose) =>
      `file '${join(root, `public/victoria-navidad-pose-${pose}.webp`).replaceAll("'", "'\\''")}'\nduration 0.5`,
  )
  .join("\n");
writeFileSync(timeline, "ffconcat version 1.0\n" + entries + "\n");
writeChristmasMusic(music, duration);
const filters = [
  "[0:v]fps=2,scale=1280:720,setsar=1,minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1[scene0]",
];
for (let i = 0; i < 28; i++) {
  const x = (i * 137 + 31) % 1280,
    y = (i * 97 + 13) % 720;
  filters.push(
    `[scene${i}]drawtext=fontfile='${font}':text='·':fontcolor=white@${i % 3 === 0 ? ".65" : ".35"}:fontsize=${i % 3 === 0 ? 25 : 16}:x='mod(${x}+t*${i % 2 ? 13 : -9}+1280,1280)':y='mod(${y}+t*${28 + (i % 27)},780)-30'[scene${i + 1}]`,
  );
}
filters.push("[scene28]format=yuv420p[out]");
try {
  const result = spawnSync(
    ffmpeg,
    [
      "-hide_banner",
      "-loglevel",
      "warning",
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      timeline,
      "-i",
      music,
      "-filter_complex",
      filters.join(";"),
      "-map",
      "[out]",
      "-map",
      "1:a:0",
      "-t",
      String(duration),
      "-r",
      "24",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "24",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      process.env.WELCOME_OUTPUT || "public/victoria-navidad-saludo-v3.mp4",
    ],
    { cwd: root, stdio: "inherit" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status || 1;
  else
    console.log(
      "Rendered complete-scene greeting: floating head and hands, 12 seconds, 1280 × 720, 24 fps, original Christmas music.",
    );
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
