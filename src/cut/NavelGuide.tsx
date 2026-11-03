/**
 * "How to measure" figure for the waist entry: a line-drawn torso with the
 * tape passing level through the navel. Inline SVG so it themes with the
 * rest of the page and works offline.
 */
export function NavelGuide() {
  return (
    <details className="navel-guide">
      <summary>how to measure</summary>
      <div className="navel-guide-body">
        <svg
          className="navel-figure"
          viewBox="0 0 200 230"
          role="img"
          aria-label="Torso seen from the front with a tape measure wrapped level around the waist, passing through the navel"
        >
          {/* torso outline */}
          <path
            className="navel-body"
            d="M58 14 C70 24 84 28 100 28 C116 28 130 24 142 14
               C150 40 150 70 144 96 C139 118 140 136 146 158
               C152 180 154 200 152 222
               M58 14 C50 40 50 70 56 96 C61 118 60 136 54 158
               C48 180 46 200 48 222"
          />
          {/* chest and rib hints */}
          <path className="navel-hint" d="M72 58 C82 66 92 66 98 62 M128 58 C118 66 108 66 102 62" />
          <path className="navel-hint" d="M80 96 C88 104 96 108 100 108 C104 108 112 104 120 96" />
          {/* hip bones */}
          <path className="navel-hint" d="M66 182 C72 192 80 200 88 204 M134 182 C128 192 120 200 112 204" />

          {/* tape: back half (dashed, behind), then front band */}
          <path className="navel-tape-back" d="M56 140 C70 130 130 130 144 140" />
          <path className="navel-tape" d="M54 142 C70 154 130 154 146 142" />
          {[66, 78, 90, 110, 122, 134].map((x) => {
            const y = 151 - 9 * ((x - 100) / 46) ** 2
            return <line key={x} className="navel-tape-tick" x1={x} y1={y - 2} x2={x} y2={y + 2} />
          })}

          {/* navel */}
          <circle className="navel-dot" cx="100" cy="151" r="2.6" />

          {/* level guide */}
          <line className="navel-level" x1="20" y1="151" x2="180" y2="151" />
          <text className="navel-label" x="184" y="146" textAnchor="end">navel</text>
        </svg>
        <ol className="navel-steps">
          <li>stand tall, feet together, belly relaxed — don't suck in.</li>
          <li>wrap the tape around bare skin, straight across the navel.</li>
          <li>check in a mirror that it's level at the back too.</li>
          <li>snug, not pressing in; read it at the end of a normal breath out.</li>
          <li>same time each fortnight — morning, before eating.</li>
        </ol>
      </div>
    </details>
  )
}
