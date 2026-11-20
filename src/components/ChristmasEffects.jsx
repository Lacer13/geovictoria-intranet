import { useEffect } from "react";
import { Snowflake } from "lucide-react";
import { snowPattern } from "../lib/appearance";

export default function ChristmasEffects({ enabled, atmosphere = "soft" }) {
  const flakes = snowPattern(atmosphere);
  useEffect(() => {
    document.body.classList.toggle("festive-paused", !enabled);
    return () => document.body.classList.remove("festive-paused");
  }, [enabled]);
  return (
    <div className="christmas-effects" aria-hidden="true">
      <div className="festive-garland">
        <svg viewBox="0 0 1200 34" preserveAspectRatio="none">
          <path
            d="M-20 4Q80 35 180 6T380 6T580 6T780 6T980 6T1180 6T1380 6"
            fill="none"
            stroke="currentColor"
            strokeWidth=".8"
          />
          {Array.from({ length: 17 }, (_, i) => (
            <g
              key={i}
              className="garland-bulb seasonal-motion"
              style={{ "--light-delay": `${-(i % 7) * 0.8}s` }}
            >
              <g
                transform={`translate(${i * 75}, ${i % 4 === 0 ? 5 : i % 2 === 0 ? 9 : 16})`}
                fill="#287449"
              >
                <path d="M-19-3Q-9-9 0 0Q-12 2-19-3ZM-10-7Q0-9 7 1Q-5 0-10-7ZM3-6Q14-5 19 3Q7 4 3-6Z" />
                <circle cx="0" cy="1" r="2.6" fill="#d91f26" />
              </g>
              <path
                d={`M${i * 75} ${i % 4 === 0 ? 5 : i % 2 === 0 ? 9 : 16}v5`}
                stroke="currentColor"
                strokeWidth="1"
              />
              <ellipse
                cx={i * 75}
                cy={(i % 4 === 0 ? 5 : i % 2 === 0 ? 9 : 16) + 6}
                rx="2.7"
                ry="4"
                fill={["#e6282f", "#fff9de", "#e6bb53", "#75b37d"][i % 4]}
              />
            </g>
          ))}
        </svg>
      </div>
      <div className="snowfall">
        {flakes.map((f, i) => (
          <span
            key={i}
            className="snowflake seasonal-motion"
            style={{
              "--x": `${f.left}%`,
              "--delay": `${f.delay}s`,
              "--duration": `${f.duration}s`,
              "--size": `${f.size}px`,
              "--drift": `${f.drift}px`,
            }}
          >
            <Snowflake size={f.size} strokeWidth={1.35} />
          </span>
        ))}
      </div>
    </div>
  );
}
