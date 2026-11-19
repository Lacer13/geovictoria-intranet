import { useEffect, useRef } from "react";
import { drawCharacter } from "./render.js";

export default function CharacterPreview({
  character,
  image,
  pose = "idle",
  reduced = false,
}) {
  const ref = useRef(null);
  useEffect(() => {
    const ctx = ref.current.getContext("2d");
    let frame;
    const draw = (time) => {
      ctx.clearRect(0, 0, 400, 340);
      drawCharacter(
        ctx,
        character,
        image,
        200,
        170,
        295,
        pose,
        time / 1000,
        reduced,
      );
      if (!reduced) frame = requestAnimationFrame(draw);
    };
    draw(0);
    return () => cancelAnimationFrame(frame);
  }, [character, image, pose, reduced]);
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
