export interface SampleSvg {
  id: string;
  name: string;
  description: string;
  pathCountEstimate: number;
  svg: string;
}

export const SAMPLE_SVGS: SampleSvg[] = [
  {
    id: 'motion-camera-logo',
    name: 'Motion Studio Icon (Gradients & Transforms)',
    description: 'Rounded rect, circle beziers, radial gradient, and nested group rotation',
    pathCountEstimate: 7,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4f46e5" stop-opacity="1" />
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="1" />
    </linearGradient>
    <radialGradient id="lensGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="1" />
      <stop offset="70%" stop-color="#0284c7" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#0369a1" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Background Card -->
  <rect x="32" y="32" width="448" height="448" rx="96" ry="96" fill="url(#bgGrad)" stroke="#ffffff" stroke-width="4" stroke-opacity="0.3"/>

  <!-- Outer Camera Aperture Ring with Group Transform -->
  <g transform="translate(256, 256) rotate(15)">
    <circle cx="0" cy="0" r="140" fill="none" stroke="#ffffff" stroke-width="14" stroke-dasharray="24 16" stroke-linecap="round"/>
    <circle cx="0" cy="0" r="100" fill="url(#lensGlow)" opacity="0.9"/>
    
    <!-- Shutter Blades (Nested group rotation) -->
    <g transform="rotate(45)">
      <polygon points="0,-80 40,-40 20,0 -20,0" fill="#ffffff" opacity="0.85"/>
      <polygon points="80,0 40,40 0,20 0,-20" fill="#ffffff" opacity="0.75"/>
      <polygon points="0,80 -40,40 -20,0 20,0" fill="#ffffff" opacity="0.85"/>
      <polygon points="-80,0 -40,-40 0,-20 0,20" fill="#ffffff" opacity="0.75"/>
    </g>

    <!-- Center Core -->
    <circle cx="0" cy="0" r="32" fill="#f43f5e" stroke="#ffffff" stroke-width="6"/>
  </g>

  <!-- Flash Indicator -->
  <circle cx="390" cy="120" r="22" fill="#fbbf24" stroke="#ffffff" stroke-width="4"/>
</svg>`,
  },
  {
    id: 'vtracer-mountain-landscape',
    name: 'Traced Landscape (High Path Count / 340+ Paths)',
    description: 'Simulates auto-traced/VTracer vector output with 340+ flat paths across 8 color palettes to test Merge Path & Layer Warning',
    pathCountEstimate: 340,
    svg: (() => {
      // Procedurally generate realistic high-density vector paths resembling auto-traced mountains/clouds
      const palettes = ['#0f172a', '#1e293b', '#334155', '#475569', '#0284c7', '#38bdf8', '#fb923c', '#f43f5e'];
      const paths: string[] = [];

      // Sky gradient base
      paths.push('<rect x="0" y="0" width="800" height="600" fill="#0f172a"/>');

      // Cluster generation for mountain ridges and traced polygonal fragments
      for (let layerIdx = 0; layerIdx < 8; layerIdx++) {
        const color = palettes[layerIdx];
        const yBase = 120 + layerIdx * 55;
        for (let col = 0; col < 42; col++) {
          const x0 = (col * 20) - 20;
          const y0 = yBase + (Math.sin(col * 0.4 + layerIdx) * 35) + ((col % 3) * 6);
          const x1 = x0 + 26;
          const y1 = y0 + 15 + ((col % 4) * 5);
          const x2 = x0 + 12;
          const y2 = y0 + 34;
          const x3 = x0 - 8;
          const y3 = y0 + 18;

          paths.push(
            `<path d="M ${x0.toFixed(1)} ${y0.toFixed(1)} L ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)} L ${x3.toFixed(1)} ${y3.toFixed(1)} Z" fill="${color}" opacity="0.95"/>`
          );
        }
      }

      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <!-- Resource defs -->
  </defs>
  ${paths.join('\n  ')}
</svg>`;
    })(),
  },
  {
    id: 'cyber-badge',
    name: 'Cyber Motion Badge (Arc, Polyline & Skew)',
    description: 'Arc commands (A), polylines, skew transform, and segmented stroke styles',
    pathCountEstimate: 12,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <linearGradient id="neonCyan" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00f2fe" />
      <stop offset="100%" stop-color="#4facfe" />
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="600" height="600" fill="#0b0f19" />

  <!-- Outer Arc Brackets -->
  <g transform="translate(300, 300)">
    <!-- Arc 1 -->
    <path d="M -200 0 A 200 200 0 0 1 0 -200" fill="none" stroke="url(#neonCyan)" stroke-width="12" stroke-linecap="round"/>
    <!-- Arc 2 -->
    <path d="M 200 0 A 200 200 0 0 1 0 200" fill="none" stroke="#f43f5e" stroke-width="12" stroke-linecap="round"/>
    
    <!-- Central Skewed Hexagon -->
    <g transform="skewX(-15) scale(1.1)">
      <polygon points="0,-110 95,-55 95,55 0,110 -95,55 -95,-55" fill="#1e1b4b" stroke="#6366f1" stroke-width="8"/>
      <!-- Inner Play Triangle -->
      <polygon points="-25,-45 45,0 -25,45" fill="#38bdf8"/>
    </g>

    <!-- Corner Crosshairs -->
    <polyline points="-160,-120 -180,-120 -180,-140" fill="none" stroke="#94a3b8" stroke-width="4"/>
    <polyline points="160,-120 180,-120 180,-140" fill="none" stroke="#94a3b8" stroke-width="4"/>
    <polyline points="-160,120 -180,120 -180,140" fill="none" stroke="#94a3b8" stroke-width="4"/>
    <polyline points="160,120 180,120 180,140" fill="none" stroke="#94a3b8" stroke-width="4"/>
  </g>
</svg>`,
  },
];
