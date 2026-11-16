export default function ChristmasArt({ className = "" }) {
  return (
    <svg
      className={`${className} festive-art seasonal-motion`}
      viewBox="0 0 560 310"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="tree-main"
          x1="280"
          y1="70"
          x2="420"
          y2="290"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#80a49a" />
          <stop offset="1" stopColor="#426e5e" />
        </linearGradient>
        <linearGradient
          id="bauble"
          x1="420"
          y1="80"
          x2="465"
          y2="145"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#e49b82" />
          <stop offset="1" stopColor="#b75f51" />
        </linearGradient>
        <linearGradient
          id="gift"
          x1="150"
          y1="230"
          x2="235"
          y2="290"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#e5bd8a" />
          <stop offset="1" stopColor="#c49058" />
        </linearGradient>
        <filter id="blur">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <pattern id="paper" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r=".6" fill="#fff" opacity=".17" />
        </pattern>
      </defs>
      <circle cx="325" cy="160" r="138" fill="#faf3e4" opacity=".5" />
      <circle
        cx="325"
        cy="160"
        r="113"
        stroke="#e6dbc5"
        strokeDasharray="3 9"
      />
      <ellipse
        cx="310"
        cy="287"
        rx="177"
        ry="10"
        fill="#183d32"
        opacity=".12"
        filter="url(#blur)"
      />
      <path d="M444 0v75" stroke="#b48c56" />
      <rect x="436" y="74" width="16" height="11" rx="3" fill="#bd995f" />
      <circle
        className="ornament-glow seasonal-motion"
        cx="444"
        cy="112"
        r="31"
        fill="url(#bauble)"
      />
      <path
        d="M424 94c-9 11-10 25-1 34"
        stroke="#f8d7c2"
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".7"
      />
      <path
        d="M444 82v59m-26-44c18 10 37 10 53 0m-54 30c18-10 37-10 54 0"
        stroke="#f8d7c2"
        opacity=".35"
      />
      <path d="M175 0v46" stroke="#b48c56" />
      <rect x="169" y="46" width="12" height="7" rx="2" fill="#bd995f" />
      <circle
        className="ornament-glow seasonal-motion"
        cx="175"
        cy="72"
        r="22"
        fill="#d7bb85"
      />
      <path
        d="M160 58c-7 7-7 19-1 26"
        stroke="#fff3cf"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M360 0v22" stroke="#b48c56" />
      <path
        d="m360 21 4 10 11 1-8 7 2 11-9-6-10 6 3-11-9-7 12-1 4-10Z"
        fill="#d2ae72"
      />
      <rect x="290" y="235" width="14" height="48" rx="3" fill="#ab8056" />
      <path
        d="m296 72 65 101h-25l47 58h-30l40 40H197l41-40h-29l46-58h-24l65-101Z"
        fill="#294e40"
      />
      <path
        d="m296 72 65 101h-25l47 58h-30l40 40h-97V72Z"
        fill="url(#tree-main)"
      />
      <path
        d="M243 164c28 13 65 20 96 17m-111 43c40 15 84 21 133 17"
        stroke="#d0b67e"
        strokeWidth="2"
        opacity=".8"
      />
      <path
        d="m296 44 5.6 12 13.4 1.7-10 9.2 2.6 13.3-11.6-6.7-11.7 6.7 2.7-13.3-10-9.2 13.4-1.7 5.6-12Z"
        fill="#dfbb78"
      />
      <circle
        className="tree-light seasonal-motion"
        cx="276"
        cy="139"
        r="5"
        fill="#d9b777"
      />
      <circle
        className="tree-light seasonal-motion"
        cx="317"
        cy="170"
        r="6"
        fill="#dc9c82"
      />
      <circle
        className="tree-light seasonal-motion"
        cx="269"
        cy="207"
        r="6"
        fill="#dc9c82"
      />
      <circle
        className="tree-light seasonal-motion"
        cx="337"
        cy="220"
        r="5"
        fill="#e5c88c"
      />
      <circle
        className="tree-light seasonal-motion"
        cx="302"
        cy="245"
        r="5"
        fill="#f3dfb3"
      />
      <circle cx="245" cy="253" r="4" fill="#d9b777" />
      <circle cx="301" cy="114" r="3" fill="#f3dfb3" />
      <path d="m418 159 37 60h-17l29 43h-97l27-43h-16l37-60Z" fill="#9eae91" />
      <path d="m418 159 37 60h-17l29 43h-49V159Z" fill="#b4bda4" />
      <rect x="413" y="262" width="10" height="19" fill="#a37e57" />
      <path
        d="m418 146 2.5 6 6.5.5-5 4 1.5 6.5-5.5-3.5-5.5 3.5 1.5-6.5-5-4 6.5-.5 2.5-6Z"
        fill="#d3ac69"
      />
      <rect x="162" y="235" width="78" height="51" rx="3" fill="url(#gift)" />
      <rect x="156" y="230" width="90" height="13" rx="3" fill="#e6c69b" />
      <path d="M195 230v56" stroke="#fbefda" strokeWidth="9" />
      <path
        d="M199 230c-23 1-32-13-25-18 9-7 20 6 25 18Zm0 0c23 1 32-13 25-18-9-7-20 6-25 18Z"
        stroke="#f6e6cc"
        strokeWidth="5"
      />
      <rect x="350" y="252" width="61" height="36" rx="3" fill="#b86858" />
      <rect x="347" y="246" width="67" height="11" rx="2" fill="#cc8470" />
      <path d="M379 246v42" stroke="#ebc69e" strokeWidth="7" />
      <path
        d="M379 247c-17 0-25-11-20-15 7-5 16 5 20 15Zm0 0c17 0 25-11 20-15-7-5-16 5-20 15Z"
        stroke="#ebc69e"
        strokeWidth="4"
      />
      <path
        d="m128 149 2 8 8 2-8 2-2 8-2-8-8-2 8-2 2-8Zm365 30 2 8 8 2-8 2-2 8-2-8-8-2 8-2 2-8ZM228 83l2 7 7 2-7 2-2 7-2-7-7-2 7-2 2-7Z"
        fill="#c7a56c"
      />
      <circle cx="215" cy="134" r="2" fill="#c7a56c" />
      <circle cx="396" cy="84" r="2" fill="#c7a56c" />
      <circle cx="478" cy="240" r="2" fill="#c7a56c" />
      <path
        d="M127 271c22-9 31-25 27-47-20 10-29 25-27 47Zm0 0c-15-2-24-14-24-31 18 3 27 13 24 31Z"
        fill="#748c72"
      />
      <path d="m128 284-1-33" stroke="#496a53" strokeWidth="2" />
      <path
        d="M148 293h338"
        stroke="#cbbd9c"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect x="152" y="35" width="335" height="253" fill="url(#paper)" />
    </svg>
  );
}
