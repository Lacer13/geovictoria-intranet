import { useEffect, useRef } from "react";
import { drawCharacter } from "./render.js";
import { characterAnimation } from "./characterAnimation.js";

export default function CharacterPreview({
  character,
  image,
  pose = "idle",
  reduced = false,
  sprite = null,
  loading = false,
  animation = null,
}) {
  const ref = useRef(null);
  useEffect(() => {
    const ctx = ref.current.getContext("2d");
    let frame;
    let started = null;
    const draw = (time) => {
      if (started === null) started = time;
      ctx.clearRect(0, 0, 400, 340);
      if (loading) return;
      const elapsed = (time - started) / 1000;
      const burst = animation && character.id === "conectia" && pose === "power";
      const closing = animation && character.id === "cierreia" && pose === "power";
      const interval = burst ? 0.1 : 0.2;
      const previewTime = animation && pose === "shooting" ? elapsed % interval : elapsed;
      const presentation = burst ? { pose: "power", elapsed: elapsed % 0.6, armed: true, shotElapsed: elapsed % interval, shotClip: "burst", shotDuration: interval } : closing ? { pose: "power", elapsed: elapsed % 1.8, armed: false, shotElapsed: elapsed % 1.8, shotClip: "closing", shotDuration: 0.3 } : null;
      drawCharacter(
        ctx,
        character,
        image,
        200,
        170,
        295,
        pose,
        previewTime,
        reduced,
        { sprite: image ? null : sprite, animation, presentation },
      );
      if (animation && (pose === "shooting" || burst || closing && elapsed % 1.8 < 0.7) && !reduced) {
        const implementation = characterAnimation(character);
        const sample = closing ? implementation.sample("closing", 0) : undefined;
        const muzzle = implementation.muzzle({ x: 200 - 295 / 2, y: 170 - 295 / 2, width: 295, height: 295 }, sample);
        ctx.fillStyle = closing ? "#ffe3a0" : "#a9fbff";
        ctx.beginPath(); ctx.ellipse(muzzle.x + (elapsed % (closing ? 1.8 : interval)) * 420, muzzle.y, closing ? 13 : 8, closing ? 5 : 2.5, 0, 0, Math.PI * 2); ctx.fill();
      }
      if (!reduced) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [character, image, sprite, pose, reduced, loading, animation]);
  return (
    <canvas
      className="arcade-character-preview"
      ref={ref}
      width={400}
      height={340}
      role="img"
      aria-label={`${character.name}: cabeza y manos flotantes${pose === "victory" ? " celebrando" : ""}`}
    />
  );
}
