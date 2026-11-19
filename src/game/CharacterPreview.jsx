import { useEffect, useRef } from "react";
import { drawCharacter } from "./render.js";
import { gameplayMuzzle } from "./tecnoiaGameplay.js";

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
      const previewTime = animation && pose === "shooting" ? elapsed % 0.2 : elapsed;
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
        { sprite: image ? null : sprite, animation },
      );
      if (animation && pose === "shooting" && !reduced) {
        const muzzle = gameplayMuzzle({ x: 200 - 295 / 2, y: 170 - 295 / 2, width: 295, height: 295 });
        ctx.fillStyle = "#a9fbff";
        ctx.beginPath(); ctx.ellipse(muzzle.x + previewTime * 420, muzzle.y, 8, 2.5, 0, 0, Math.PI * 2); ctx.fill();
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
