import { useEffect } from "react";

const flakes = Array.from({ length: 42 }, (_, i) => ({
  left: (i * 37 + 9) % 101,
  delay: -((i * 7) % 29),
  duration: 17 + ((i * 3) % 19),
  size: i % 4 === 0 ? 14 : 3 + (i % 4),
  drift: (i % 2 ? 1 : -1) * (22 + (i % 50)),
  symbol: i % 4 === 0,
}));

export default function ChristmasEffects({ enabled }) {
  useEffect(() => {
    document.body.classList.toggle("festive-paused", !enabled);
    return () => document.body.classList.remove("festive-paused");
  }, [enabled]);
  return (
    <div className="christmas-effects" aria-hidden="true">
      <div className="festive-garland">
        <svg viewBox="0 0 1200 28" preserveAspectRatio="none">
          <path
            d="M-20 4Q80 35 180 6T380 6T580 6T780 6T980 6T1180 6T1380 6"
            fill="none"
            stroke="currentColor"
            strokeWidth=".8"
          />
          {Array.from({ length: 25 }, (_, i) => (
            <g
              key={i}
              className="garland-bulb seasonal-motion"
              style={{ "--light-delay": `${-(i % 7) * 0.8}s` }}
            >
              <path
                d={`M${i * 50} ${i % 4 === 0 ? 5 : i % 2 === 0 ? 9 : 16}v5`}
                stroke="currentColor"
                strokeWidth="1"
              />
              <ellipse
                cx={i * 50}
                cy={(i % 4 === 0 ? 5 : i % 2 === 0 ? 9 : 16) + 6}
                rx="2"
                ry="3"
                fill={["#bd8b65", "#7f9d82", "#c77c6a", "#d1b476"][i % 4]}
              />
            </g>
          ))}
        </svg>
      </div>
      <div className="snowfall">
        {flakes.map((f, i) => (
          <span
            key={i}
            className={`snowflake seasonal-motion ${f.symbol ? "snow-crystal" : "snow-dot"}`}
            style={{
              "--x": `${f.left}%`,
              "--delay": `${f.delay}s`,
              "--duration": `${f.duration}s`,
              "--size": `${f.size}px`,
              "--drift": `${f.drift}px`,
            }}
          >
            {f.symbol ? "❄" : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
