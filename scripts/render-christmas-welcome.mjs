import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeChristmasMusic } from "./christmas-music.mjs";

// The atlas contains complete, separated head / sleigh / waving-hand sprites.
// Rectangles include transparent margins, never cut through a robot part.
const root = fileURLToPath(new URL("../", import.meta.url));
const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
const duration = 14;
const fps = 30;
// Add the user's recording later without changing the animation assets.
const voice = process.env.WELCOME_VOICE;
if (voice && !existsSync(voice))
  throw new Error("WELCOME_VOICE file not found");
const temporary = mkdtempSync(join(tmpdir(), "geovictoria-welcome-"));
const music = join(temporary, "christmas-music.wav");
const filterFile = join(temporary, "welcome.fffilters");
const output =
  process.env.WELCOME_OUTPUT || "public/victoria-navidad-saludo-v4.mp4";
const font =
  process.env.FONT_PATH ||
  (existsSync("/System/Library/Fonts/Supplemental/Arial.ttf")
    ? "/System/Library/Fonts/Supplemental/Arial.ttf"
    : "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf");
const run = (args) => {
  const result = spawnSync(
    ffmpeg,
    ["-hide_banner", "-loglevel", "warning", "-y", ...args],
    {
      cwd: root,
      stdio: "inherit",
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`FFmpeg exited with ${result.status}`);
};
const ease = "(1-pow(1-min(t/3.2,1),3))";
const greetingBobs =
  "(exp(-pow((t-4.15)/0.14,2))+exp(-pow((t-4.72)/0.14,2))+exp(-pow((t-5.26)/0.14,2)))";
const filters = [
  "[0:v]scale=1280:720,setsar=1,format=rgba[forest]",
  "[1:v]format=rgba,split=3[atlas0][atlas1][atlas2]",
  // Remove only very faint generated alpha spill from the sprite margins.
  "[atlas0]crop=640:580:40:70,lut=a='if(lt(val,48),0,(val-48)*255/207)',scale=360:-1,rotate='0.025*sin(t*2.1)':ow=430:oh=400:c=none[head]",
  "[atlas1]crop=865:550:690:90,lut=a='if(lt(val,48),0,(val-48)*255/207)',scale=840:-1[sleigh]",
  "[atlas2]crop=440:450:1645:140,lut=a='if(lt(val,48),0,(val-48)*255/207)',scale=170:-1,rotate='0.23*sin(max(t-3.1,0)*7)*min(max(t-3.1,0),1)':ow=240:oh=240:c=none[hand]",
  `color=c=black@0:s=960x720:r=${fps}:d=${duration},format=rgba[empty]`,
  "[empty][sleigh]overlay=x=20:y=150:format=auto[actor0]",
  `[actor0][head]overlay=x='405+3*sin(t*1.7)':y='-35+3*sin(t*2.1)-7*${greetingBobs}':format=auto[actor1]`,
  "[actor1][hand]overlay=x='700+7*sin(max(t-3.1,0)*7)':y='190+5*sin(t*2.2)':format=auto[actor2]",
  // Approach from the distance along an arc; all parts stay inside the frame.
  `[actor2]scale=w='trunc(960*(0.22+0.68*${ease}))':h=-1:eval=frame[approach]`,
  `color=c=black@0:s=900x110:r=${fps}:d=${duration},format=rgba,geq=r=0:g=0:b=0:a='42*exp(-pow((X-450)/250,2)-pow((Y-55)/17,2))',fade=t=in:st=2:d=1.5:alpha=1[shadow]`,
  "[forest][shadow]overlay=x=340:y=600:format=auto[ground]",
  `[ground][approach]overlay=x='110+250*${ease}':y='80-40*${ease}+3*sin(t*2.1)+if(gt(t,3.2),9*exp(-(t-3.2)*2.2)*sin((t-3.2)*9),0)':eval=frame:format=auto[scene0]`,
];
// Three depth planes, different drift and speeds. No random frame flicker.
for (let i = 0; i < 42; i++) {
  const x = (i * 137 + 31) % 1280;
  const y = (i * 97 + 13) % 720;
  const near = i % 5 === 0;
  filters.push(
    `[scene${i}]drawtext=fontfile='${font}':text='·':fontcolor=white@${near ? ".65" : ".35"}:fontsize=${near ? 30 : 15}:x='mod(${x}+t*${near ? -23 : -8}+1280,1280)':y='mod(${y}+t*${near ? 76 : 29},780)-30'[scene${i + 1}]`,
  );
}
// A short trail of warm sparkles follows the arriving sleigh, then disappears.
for (let i = 0; i < 9; i++) {
  const input = 42 + i;
  filters.push(
    `[scene${input}]drawtext=fontfile='${font}':text='+':fontcolor=0xffd979@0.65:fontsize=${12 + (i % 3) * 4}:x='${160 - i * 24}+250*${ease}':y='${225 + (i % 3) * 14}+170*${ease}':alpha='max(0,1-t/3.6)*pow(sin(t*4+${i}),2)'[scene${input + 1}]`,
  );
}
filters.push(
  "[scene51]format=yuv420p[out]",
  "[2:a]volume=0.65,afade=t=out:st=12.6:d=1.4[music]",
);
if (voice) {
  filters.push(
    "[3:a]aresample=48000,loudnorm=I=-17:TP=-2:LRA=7,adelay=4000:all=1,apad,asplit=2[voice][sidechain]",
    "[music][sidechain]sidechaincompress=threshold=0.025:ratio=8:attack=15:release=400[bed]",
    "[bed][voice]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.92[audio]",
  );
} else filters.push("[music]alimiter=limit=0.92[audio]");
try {
  writeChristmasMusic(music, duration);
  writeFileSync(filterFile, filters.join(";\n"));
  run([
    "-loop",
    "1",
    "-framerate",
    String(fps),
    "-i",
    "public/victoria-navidad-fondo.webp",
    "-loop",
    "1",
    "-framerate",
    String(fps),
    "-i",
    "public/victoria-navidad-rig-v4.webp",
    "-i",
    music,
    ...(voice ? ["-i", voice] : []),
    "-filter_complex_script",
    filterFile,
    "-map",
    "[out]",
    "-map",
    "[audio]",
    "-t",
    String(duration),
    "-r",
    String(fps),
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
    "-ac",
    "2",
    "-movflags",
    "+faststart",
    output,
  ]);
  if (!process.env.WELCOME_OUTPUT) {
    run([
      "-ss",
      "6.2",
      "-i",
      output,
      "-frames:v",
      "1",
      "-q:v",
      "2",
      "-update",
      "1",
      "public/victoria-navidad-saludo-v4.jpg",
    ]);
  }
  console.log(
    `Rendered arrival + independent head and waving hand + ${voice ? "provided recording" : "Christmas music"}; 14 seconds, 1280 × 720, 30 fps.`,
  );
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
