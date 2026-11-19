import { useEffect, useRef } from "react";
import { drawCharacter } from "./render.js";

export default function CharacterPreview({
  character,
  image,
  pose = "idle",
  reduced = false,
  sprite = null,
  loading = false,
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
      drawCharacter(
        ctx,
        character,
        image,
        200,
        170,
        295,
        pose,
        (time - started) / 1000,
        reduced,
        { sprite: image ? null : sprite },
      );
      if (!reduced) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [character, image, sprite, pose, reduced, loading]);
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
