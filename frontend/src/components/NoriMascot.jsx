export default function NoriMascot({ thinking = false }) {
  return (
    <svg
      className={`nori-mascot ${thinking ? "nori-thinking" : ""}`}
      viewBox="0 0 160 172"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="80" cy="158" rx="44" ry="8" fill="#354638" opacity=".08" />
      <g className="nori-leaves">
        <path
          d="M80 106V62"
          stroke="#354638"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path d="M79 82C45 87 28 65 33 40C61 36 83 52 79 82Z" fill="#6F9165" />
        <path
          d="M81 67C75 38 94 17 122 20C127 47 110 68 81 67Z"
          fill="#354638"
        />
        <path
          d="M80 83L49 56M82 65L106 36"
          stroke="#F7F4ED"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity=".65"
        />
        <path
          d="M81 99C96 78 112 78 123 84C116 102 99 108 81 99Z"
          fill="#91AD7D"
        />
      </g>
      <path
        d="M45 110H115L106 147C104 155 57 155 54 147L45 110Z"
        fill="#A67554"
      />
      <path
        d="M50 117H111L108 129C91 136 70 137 54 130L50 117Z"
        fill="#BC8D69"
      />
      <rect x="40" y="101" width="80" height="18" rx="8" fill="#C79571" />
      <ellipse cx="80" cy="102" rx="31" ry="4" fill="#354638" />
      <path
        d="M80 104V92"
        stroke="#354638"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <ellipse cx="67" cy="132" rx="3" ry="4" fill="#354638" />
      <ellipse cx="94" cy="132" rx="3" ry="4" fill="#354638" />
      <path
        d="M75 140Q80 145 86 140"
        stroke="#354638"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <ellipse cx="59" cy="139" rx="5" ry="3" fill="#E7B19A" />
      <ellipse cx="102" cy="139" rx="5" ry="3" fill="#E7B19A" />
      <path
        d="M24 83V91M20 87H28M135 48V58M130 53H140"
        stroke="#A67554"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="30" cy="24" r="3" fill="#C6D4BC" />
      <circle cx="137" cy="115" r="3" fill="#C6D4BC" />
    </svg>
  );
}
