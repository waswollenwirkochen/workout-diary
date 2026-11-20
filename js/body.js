// Stilisierte Körperkarte (vorn / hinten). Linke Körperhälfte wird gespiegelt.
const MIRROR = 'matrix(-1 0 0 1 160 0)';

const FRONT = {
  traps: ['M72 54 Q66 60 56 63 L70 66 Z'],
  shoulders: ['M54 63 Q40 64 35 78 Q34 90 38 98 Q44 88 50 80 Q56 72 60 66 Z'],
  chest: ['M78 68 L62 67 Q52 72 48 84 Q47 96 52 102 Q66 108 78 104 Z'],
  biceps: ['M38 101 Q34 112 35 126 Q37 136 42 138 Q48 132 50 118 Q51 106 48 98 Z'],
  forearms: ['M35 142 Q29 156 28 172 Q28 180 31 184 L37 184 Q43 168 46 152 Q46 144 43 140 Z'],
  obliques: ['M67 106 L54 104 Q52 122 55 140 Q57 156 62 164 L68 166 Q67 140 67 106 Z'],
  quads: ['M57 178 Q50 196 51 222 Q53 246 60 258 Q66 262 72 258 Q76 236 76 212 Q76 194 73 182 Z'],
  adductors: ['M75 186 L79 188 L79 232 Q76 222 75 210 Z'],
  calves: ['M58 272 Q54 290 56 312 Q58 326 62 332 L67 332 Q71 312 71 292 Q70 278 68 270 Z']
};
const FRONT_CENTER = {
  abs: ['M70 108 Q80 106 90 108 L91 150 Q90 166 80 172 Q70 166 69 150 Z']
};
const BACK = {
  shoulders: ['M54 63 Q40 64 35 78 Q34 90 38 98 Q44 88 50 80 Q56 72 60 66 Z'],
  upperback: ['M58 67 Q51 74 51 88 Q56 98 66 100 L75 95 L72 84 Q68 73 58 67 Z'],
  lats: ['M52 97 Q50 112 54 128 Q60 144 72 152 L75 132 L76 100 L66 103 Z'],
  triceps: ['M38 101 Q34 112 35 126 Q37 136 42 138 Q48 132 50 118 Q51 106 48 98 Z'],
  forearms: ['M35 142 Q29 156 28 172 Q28 180 31 184 L37 184 Q43 168 46 152 Q46 144 43 140 Z'],
  glutes: ['M79 170 Q64 168 56 176 Q52 190 56 202 Q66 210 79 204 Z'],
  hamstrings: ['M56 207 Q52 226 56 250 Q60 260 66 260 Q72 258 75 248 Q78 228 77 209 Z'],
  calves: ['M57 270 Q52 286 55 302 Q58 314 63 316 Q68 314 70 300 Q71 284 68 270 Z']
};
const BACK_CENTER = {
  traps: ['M80 48 L70 56 L58 64 Q69 70 73 84 L80 112 L87 84 Q91 70 102 64 L90 56 Z'],
  lowerback: ['M74 134 Q80 130 86 134 L90 166 Q80 171 70 166 Z']
};

function silhouette() {
  const L = `
    <line x1="42" y1="72" x2="41" y2="138" stroke-width="16"/>
    <line x1="41" y1="140" x2="32" y2="184" stroke-width="12"/>
    <ellipse cx="31" cy="194" rx="5.5" ry="9" stroke="none"/>
    <line x1="64" y1="184" x2="63" y2="262" stroke-width="27"/>
    <line x1="63" y1="266" x2="62" y2="334" stroke-width="16"/>
    <ellipse cx="60" cy="342" rx="9" ry="5" stroke="none"/>`;
  return `<g class="sil" stroke-linecap="round">
    <ellipse cx="80" cy="28" rx="14" ry="17" stroke="none"/>
    <rect x="73" y="40" width="14" height="18" rx="4" stroke="none"/>
    <path stroke="none" d="M66 54 Q58 60 46 62 Q38 64 36 74 L40 104 Q46 140 52 170 L54 184 L106 184 L108 170 Q114 140 120 104 L124 74 Q122 64 114 62 Q102 60 94 54 Z"/>
    ${L}<g transform="${MIRROR}">${L}</g></g>`;
}

function zonePaths(side, center, mirrorAll = true) {
  let s = '';
  for (const [z, ps] of Object.entries(side)) for (const d of ps)
    s += `<path class="z" data-z="${z}" d="${d}"/><path class="z" data-z="${z}" d="${d}" transform="${MIRROR}"/>`;
  for (const [z, ps] of Object.entries(center)) for (const d of ps) s += `<path class="z" data-z="${z}" d="${d}"/>`;
  return s;
}

export function bodySVG() {
  return `<svg class="body" viewBox="0 0 340 362" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Körperkarte">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g transform="translate(5,4)">
    ${silhouette()}
    ${zonePaths(FRONT, FRONT_CENTER)}
    <g class="lines"><path d="M70.5 122 H89.5 M70 136 H90 M70 150 H90 M80 108 V170"/></g>
  </g>
  <g transform="translate(175,4)">
    ${silhouette()}
    ${zonePaths(BACK, BACK_CENTER)}
    <g class="lines"><path d="M80 112 V130"/></g>
  </g>
  <text x="85" y="360" class="lbl">vorn</text><text x="255" y="360" class="lbl">hinten</text>
</svg>`;
}

// g: 0..1 → Farbe
export function heatColor(g) {
  if (g <= 0) return null;
  const h = 14 + (1 - g) * 26, l = 50 + (1 - g) * 8;
  return `hsl(${h} 96% ${l}%)`;
}

export function paintBody(svg, glows, rec = new Set()) {
  svg.querySelectorAll('.z').forEach(p => {
    const z = p.dataset.z, g = glows[z] || 0;
    const c = heatColor(g);
    p.style.fill = c || '';
    p.style.fillOpacity = c ? (0.5 + 0.5 * g).toFixed(2) : '';
    p.classList.toggle('hot', g > 0);
    p.classList.toggle('rec', rec.has(z));
  });
}
