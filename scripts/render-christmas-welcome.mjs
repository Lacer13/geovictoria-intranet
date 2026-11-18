import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

// Requires FFmpeg with libx264 and drawtext; no credentials or external API calls.
const root = fileURLToPath(new URL("../", import.meta.url));
const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
const duration = 10;
const font =
  process.env.FONT_PATH ||
  (existsSync("/System/Library/Fonts/Supplemental/Arial.ttf")
    ? "/System/Library/Fonts/Supplemental/Arial.ttf"
    : "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf");
const filters = [
  "[0:v]scale=1344:756,crop=1280:720:x='32+16*sin(t/4)':y=18,setsar=1[forest]",
  "[1:v]scale=890:-1,format=rgba[sleigh]",
  "[forest][sleigh]overlay=x='if(lt(t,1.7),1280-950*(1-pow(1-t/1.7,3)),if(lt(t,8.3),330+9*sin(t*1.5),330-1300*pow((t-8.3)/1.7,2)))':y='155+8*sin(t*2.2)'[scene0]",
];
// Foreground flakes move independently of the camera and the sleigh.
for (let i = 0; i < 34; i++) {
  const x = (i * 137 + 31) % 1280;
  const y = (i * 97 + 13) % 720;
  filters.push(
    `[scene${i}]drawtext=fontfile='${font}':text='·':fontcolor=white@${i % 3 === 0 ? ".75" : ".4"}:fontsize=${i % 3 === 0 ? 29 : 18}:x='mod(${x}+t*${i % 2 ? 13 : -9}+1280,1280)':y='mod(${y}+t*${28 + (i % 27)},780)-30'[scene${i + 1}]`,
  );
}
filters.push("[scene34]fade=t=in:d=0.35,format=yuv420p[out]");
const args = [
  "-hide_banner",
  "-loglevel",
  "warning",
  "-y",
  "-loop",
  "1",
  "-framerate",
  "24",
  "-i",
  "public/victoria-navidad-fondo.webp",
  "-loop",
  "1",
  "-framerate",
  "24",
  "-i",
  "public/victoria-navidad-trineo.webp",
  "-i",
  "public/Nuevo Video VictorIA.mp4",
  "-filter_complex",
  filters.join(";"),
  "-map",
  "[out]",
  "-map",
  "2:a:0",
  "-af",
  "afade=t=out:st=9.5:d=0.5",
  "-t",
  String(duration),
  "-r",
  "24",
  "-c:v",
  "libx264",
  "-preset",
  "medium",
  "-crf",
  "26",
  "-c:a",
  "aac",
  "-b:a",
  "96k",
  "-movflags",
  "+faststart",
  "public/victoria-navidad.mp4",
];
const result = spawnSync(ffmpeg, args, { cwd: root, stdio: "inherit" });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
console.log(
  "Christmas welcome rendered: 1280 × 720, 24 fps, 10 seconds; original greeting audio retained.",
);
