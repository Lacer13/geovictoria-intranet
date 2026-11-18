import { writeFileSync } from "node:fs";

// An original short arrangement: celesta, warm arpeggios and sleigh bells.
// It uses synthesized instruments, with no sampled or third-party recordings.
export function writeChristmasMusic(path, seconds = 12) {
  const rate = 48000,
    length = Math.round(seconds * rate);
  const left = new Float64Array(length),
    right = new Float64Array(length);
  const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);
  const tone = (start, duration, midi, gain, pan, instrument = "celesta") => {
    const freq = frequency(midi),
      first = Math.round(start * rate);
    const samples = Math.min(Math.round(duration * rate), length - first);
    for (let i = 0; i < samples; i++) {
      const t = i / rate;
      const attack = Math.min(1, t / 0.009);
      const release = Math.min(1, (duration - t) / 0.08);
      const envelope =
        attack * release * Math.exp(-t * (instrument === "bass" ? 2 : 4.8));
      const wave =
        instrument === "bass"
          ? Math.sin(2 * Math.PI * freq * t) +
            0.16 * Math.sin(4 * Math.PI * freq * t)
          : Math.sin(2 * Math.PI * freq * t) +
            0.3 * Math.sin(2 * Math.PI * freq * 2.756 * t) * Math.exp(-t * 4) +
            0.12 * Math.sin(2 * Math.PI * freq * 5.4 * t) * Math.exp(-t * 9);
      const sample = wave * envelope * gain;
      left[first + i] += sample * Math.sqrt((1 - pan) / 2);
      right[first + i] += sample * Math.sqrt((1 + pan) / 2);
    }
  };
  // Six bars in G major, 120 BPM. This melody was composed for the welcome.
  const melody = [
    [79, 1],
    [76, 0.5],
    [79, 0.5],
    [86, 1],
    [83, 1],
    [81, 0.5],
    [83, 0.5],
    [79, 1],
    [76, 1],
    [74, 1],
    [76, 0.5],
    [79, 0.5],
    [81, 1],
    [79, 2],
    [74, 1],
    [71, 1],
    [74, 1],
    [79, 1],
    [83, 1],
    [81, 0.5],
    [79, 0.5],
    [76, 1],
    [79, 1],
    [86, 2],
    [79, 2],
  ];
  let beat = 0;
  for (const [note, beats] of melody) {
    tone(beat * 0.5 + 0.03, beats * 0.5 + 0.65, note, 0.18, 0.12);
    beat += beats;
  }
  const chords = [
    [55, 59, 62],
    [48, 52, 55],
    [55, 59, 62],
    [50, 54, 57],
    [48, 52, 55],
    [55, 59, 62],
  ];
  chords.forEach((chord, bar) => {
    tone(bar * 2, 1.9, chord[0] - 12, 0.13, 0, "bass");
    for (let step = 0; step < 8; step++)
      tone(
        bar * 2 + step * 0.25,
        0.8,
        chord[step % 3] + 12,
        0.045,
        step % 2 ? -0.4 : 0.4,
      );
  });
  let random = 2026;
  const noise = () => {
    random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
    return (random / 0x100000000) * 2 - 1;
  };
  for (let pulse = 0; pulse < 48; pulse++) {
    const start = Math.round((pulse * 0.25 + 0.01) * rate);
    for (let i = 0; i < Math.min(0.13 * rate, length - start); i++) {
      const t = i / rate;
      const metallic =
        0.6 * Math.sin(2 * Math.PI * 5800 * t) +
        0.3 * Math.sin(2 * Math.PI * 8100 * t) +
        0.15 * noise();
      const sample =
        metallic *
        Math.exp(-t * 42) *
        Math.min(1, t / 0.002) *
        (pulse % 2 ? 0.017 : 0.03);
      left[start + i] += sample * 0.8;
      right[start + i] += sample;
    }
  }
  let peak = 0;
  for (let i = 0; i < length; i++)
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  const wav = Buffer.alloc(44 + length * 4);
  wav.write("RIFF");
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 4, 28);
  wav.writeUInt16LE(4, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(length * 4, 40);
  for (let i = 0; i < length; i++) {
    const fade = Math.min(1, i / rate / 0.1, (seconds - i / rate) / 0.65);
    const gain = (fade * 0.7) / Math.max(peak, 0.01);
    wav.writeInt16LE(Math.round(left[i] * gain * 32767), 44 + i * 4);
    wav.writeInt16LE(Math.round(right[i] * gain * 32767), 46 + i * 4);
  }
  writeFileSync(path, wav);
}
